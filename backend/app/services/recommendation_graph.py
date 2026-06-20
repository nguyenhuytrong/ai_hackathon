from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph
from pydantic import ValidationError

from app.ai.llm_provider import RecommendationLlmProvider
from app.db.models import Resource
from app.db.repositories import SourceRepository
from app.rag.ingestion.embeddings import EmbeddingProvider
from app.schemas.rag import RagSearchFilters, RagSearchRequest
from app.schemas.recommendation import (
    ActionPlanItem,
    RecommendationRunResponse,
    RuleMatchResult,
    SourceCitation,
    SupportRecommendation,
)
from app.schemas.recommendation_workflow import (
    EvidenceBundle,
    EvidenceGrade,
    GeneratedRecommendationPayload,
    ProfileSummary,
    RecommendationWorkflowTrace,
    RetrievalQuery,
)
from app.services.rag_search_service import RagSearchService
from app.services.rule_matching_service import RuleMatchingService

DISCLAIMER = "CareBridge does not determine final eligibility, provide medical advice, or replace healthcare professionals."
GRAPH_VERSION = "phase6-langgraph-v1"
FORBIDDEN_PHRASES = ("you qualify", "approved", "guaranteed")


class RecommendationGraphState(TypedDict, total=False):
    run_id: str
    profile: dict
    rehab_snapshot: dict | None
    include_rag_evidence: bool
    profile_summary: dict
    rule_matches: list[dict]
    fallback_recommendations: list[dict]
    fallback_action_plan: list[dict]
    fallback_questions_to_ask: dict[str, list[str]]
    retrieval_queries: list[dict]
    evidence_bundles: list[dict]
    evidence_grades: list[dict]
    generated_payload: dict
    fallback_reason: str | None


class RecommendationGraphResult:
    def __init__(self, response: RecommendationRunResponse, trace: RecommendationWorkflowTrace):
        self.response = response
        self.trace = trace


class RecommendationGraphRunner:
    def __init__(
        self,
        *,
        resources: dict[str, Resource],
        sources: SourceRepository | None,
        embedding_provider: EmbeddingProvider | None,
        llm_provider: RecommendationLlmProvider,
    ):
        self.resources = resources
        self.sources = sources
        self.embedding_provider = embedding_provider
        self.llm_provider = llm_provider
        self.rule_matching = RuleMatchingService()
        self.graph = self._compile_graph()

    def run(
        self,
        *,
        profile: dict,
        run_id: str,
        include_rag_evidence: bool,
        rehab_snapshot: dict | None = None,
    ) -> RecommendationGraphResult:
        state = self.graph.invoke(
            {
                "run_id": run_id,
                "profile": profile,
                "rehab_snapshot": rehab_snapshot,
                "include_rag_evidence": include_rag_evidence,
                "fallback_reason": None,
            }
        )
        payload = GeneratedRecommendationPayload.model_validate(state["generated_payload"])
        response = RecommendationRunResponse(
            runId=run_id,
            summary=payload.summary,
            recommendations=payload.recommendations,
            actionPlan=payload.actionPlan,
            questionsToAsk=payload.questionsToAsk,
            disclaimer=DISCLAIMER,
        )
        trace = RecommendationWorkflowTrace(
            graphVersion=GRAPH_VERSION,
            provider={"name": self.llm_provider.name, "model": self.llm_provider.model},
            profileSummary=state["profile_summary"],
            rehabSnapshot=state.get("rehab_snapshot"),
            ruleMatches=state["rule_matches"],
            retrievalQueries=state["retrieval_queries"],
            evidence=state["evidence_grades"],
            fallbackReason=state.get("fallback_reason"),
        )
        return RecommendationGraphResult(response=response, trace=trace)

    def _compile_graph(self):
        graph = StateGraph(RecommendationGraphState)
        graph.add_node("build_profile_summary", self._build_profile_summary)
        graph.add_node("run_rule_matching", self._run_rule_matching)
        graph.add_node("generate_retrieval_queries", self._generate_retrieval_queries)
        graph.add_node("retrieve_evidence", self._retrieve_evidence)
        graph.add_node("grade_evidence", self._grade_evidence)
        graph.add_node("generate_recommendations", self._generate_recommendations)
        graph.add_node("generate_action_plan", self._generate_action_plan)
        graph.add_edge(START, "build_profile_summary")
        graph.add_edge("build_profile_summary", "run_rule_matching")
        graph.add_edge("run_rule_matching", "generate_retrieval_queries")
        graph.add_edge("generate_retrieval_queries", "retrieve_evidence")
        graph.add_edge("retrieve_evidence", "grade_evidence")
        graph.add_edge("grade_evidence", "generate_recommendations")
        graph.add_edge("generate_recommendations", "generate_action_plan")
        graph.add_edge("generate_action_plan", END)
        return graph.compile()

    @staticmethod
    def _build_profile_summary(state: RecommendationGraphState) -> dict:
        profile = state["profile"]
        county = profile.get("county")
        state_code = profile.get("state")
        location_label = None
        if county and state_code:
            location_label = f"{county} County, {state_code}"
        summary = ProfileSummary(
            caregiverName=profile.get("caregiverName"),
            careRecipient=profile.get("careRecipient"),
            state=state_code,
            county=county,
            locationLabel=location_label,
            dischargeTime=profile.get("dischargeTime"),
            mobility=profile.get("mobility"),
            transportation=profile.get("transportation"),
            insurance=profile.get("insurance"),
            caregiverWorking=profile.get("caregiverWorking"),
            caregiverBurden=profile.get("caregiverBurden"),
            biggestChallenge=profile.get("biggestChallenge"),
        )
        return {"profile_summary": summary.model_dump(mode="json")}

    def _run_rule_matching(self, state: RecommendationGraphState) -> dict:
        matches = self.rule_matching.match_profile(state["profile"], state.get("rehab_snapshot"))
        recommendations = [
            self._recommendation_from_match(self.resources[match.resourceId], match)
            for match in matches
            if match.matchStatus != "not_matched"
        ]
        return {
            "rule_matches": [match.model_dump(mode="json") for match in matches],
            "fallback_recommendations": [
                recommendation.model_dump(mode="json") for recommendation in recommendations
            ],
            "fallback_action_plan": [
                item.model_dump(mode="json") for item in self._build_action_plan(recommendations)
            ],
            "fallback_questions_to_ask": self._build_questions(),
        }

    def _generate_retrieval_queries(self, state: RecommendationGraphState) -> dict:
        queries = []
        profile = state["profile_summary"]
        for recommendation in state["fallback_recommendations"]:
            filters = {"category": recommendation["category"]}
            if profile.get("state"):
                filters["state"] = profile["state"]
            if profile.get("county"):
                filters["county"] = profile["county"]
            query = " ".join(
                [
                    recommendation["title"],
                    recommendation["category"],
                    *recommendation["matchedFactors"],
                    *recommendation["missingInformation"],
                    *recommendation["nextSteps"],
                ]
            )
            queries.append(
                RetrievalQuery(
                    resourceId=recommendation["id"],
                    category=recommendation["category"],
                    query=query,
                    filters=filters,
                ).model_dump(mode="json")
            )
        return {"retrieval_queries": queries}

    def _retrieve_evidence(self, state: RecommendationGraphState) -> dict:
        bundles = []
        if not state["include_rag_evidence"] or self.sources is None or self.embedding_provider is None:
            return {
                "evidence_bundles": [
                    EvidenceBundle(
                        resourceId=query["resourceId"],
                        category=query["category"],
                        chunks=[],
                    ).model_dump(mode="json")
                    for query in state["retrieval_queries"]
                ]
            }

        service = RagSearchService(self.sources, self.embedding_provider)
        for query in state["retrieval_queries"]:
            filters = RagSearchFilters(
                category=query["category"],
                state=query["filters"].get("state"),
                county=query["filters"].get("county"),
                resourceId=query["resourceId"],
            )
            response = service.search(
                RagSearchRequest(query=query["query"], filters=filters, topK=2)
            )
            chunks = [result.model_dump(mode="json") for result in response.results]
            bundles.append(
                EvidenceBundle(
                    resourceId=query["resourceId"],
                    category=query["category"],
                    chunks=chunks,
                ).model_dump(mode="json")
            )
        return {"evidence_bundles": bundles}

    @staticmethod
    def _grade_evidence(state: RecommendationGraphState) -> dict:
        grades = []
        for bundle in state["evidence_bundles"]:
            source_ids = []
            chunk_ids = []
            for chunk in bundle["chunks"]:
                chunk_ids.append(chunk["chunkId"])
                source_id = chunk["source"]["sourceId"]
                if source_id not in source_ids:
                    source_ids.append(source_id)
            grades.append(
                EvidenceGrade(
                    resourceId=bundle["resourceId"],
                    evidenceStatus="partial" if chunk_ids else "insufficient",
                    chunkIds=chunk_ids,
                    sourceIds=source_ids,
                ).model_dump(mode="json")
            )
        return {"evidence_grades": grades}

    def _generate_recommendations(self, state: RecommendationGraphState) -> dict:
        fallback_payload = self._fallback_payload(state)
        provider_payload = {
            "profileSummary": state["profile_summary"],
            "ruleMatches": state["rule_matches"],
            "retrievalQueries": state["retrieval_queries"],
            "evidence": state["evidence_bundles"],
            "rehabSnapshot": state.get("rehab_snapshot"),
            "fallbackRecommendations": fallback_payload["recommendations"],
            "fallbackActionPlan": fallback_payload["actionPlan"],
            "fallbackQuestionsToAsk": fallback_payload["questionsToAsk"],
        }
        try:
            generated = GeneratedRecommendationPayload.model_validate(
                self.llm_provider.generate(provider_payload)
            )
            self._validate_generated_payload(generated, state)
            return {"generated_payload": generated.model_dump(mode="json"), "fallback_reason": None}
        except RuntimeError as error:
            return {"generated_payload": fallback_payload, "fallback_reason": str(error)}
        except (ValidationError, ValueError):
            return {
                "generated_payload": fallback_payload,
                "fallback_reason": "generated output failed validation",
            }

    @staticmethod
    def _generate_action_plan(state: RecommendationGraphState) -> dict:
        return {"generated_payload": state["generated_payload"]}

    def _fallback_payload(self, state: RecommendationGraphState) -> dict:
        evidence_by_resource = {
            bundle["resourceId"]: bundle["chunks"] for bundle in state["evidence_bundles"]
        }
        grade_by_resource = {
            grade["resourceId"]: grade["evidenceStatus"] for grade in state["evidence_grades"]
        }
        recommendations = []
        for recommendation in state["fallback_recommendations"]:
            chunks = evidence_by_resource.get(recommendation["id"], [])
            sources = []
            seen_source_ids = set()
            for chunk in chunks:
                source_id = chunk["source"]["sourceId"]
                if source_id in seen_source_ids:
                    continue
                seen_source_ids.add(source_id)
                sources.append(
                    SourceCitation(
                        sourceId=source_id,
                        title=chunk["source"]["title"],
                        sourceType=str(chunk["metadata"].get("sourceType", "webpage")),
                        url=chunk["source"].get("url"),
                        page=chunk["source"].get("page"),
                        excerpt=chunk["text"],
                    ).model_dump(mode="json")
                )
            recommendations.append(
                {
                    **recommendation,
                    "sources": sources,
                    "evidenceStatus": grade_by_resource.get(recommendation["id"], "insufficient"),
                }
            )
        return {
            "summary": (
                f"Based on your situation, CareBridge found {len(recommendations)} "
                "support areas worth exploring."
            ),
            "recommendations": recommendations,
            "actionPlan": state["fallback_action_plan"],
            "questionsToAsk": state["fallback_questions_to_ask"],
        }

    @staticmethod
    def _validate_generated_payload(payload: GeneratedRecommendationPayload, state: RecommendationGraphState) -> None:
        allowed_sources = {
            source_id
            for grade in state["evidence_grades"]
            for source_id in grade["sourceIds"]
        }
        serialized = payload.model_dump_json().lower()
        if any(phrase in serialized for phrase in FORBIDDEN_PHRASES):
            raise ValueError("generated output failed validation")
        for recommendation in payload.recommendations:
            for source in recommendation.sources:
                if source.sourceId not in allowed_sources:
                    raise ValueError("generated output failed validation")

    @staticmethod
    def _recommendation_from_match(resource: Resource, match: RuleMatchResult) -> SupportRecommendation:
        details = resource.details_json
        return SupportRecommendation(
            id=resource.id,
            title=resource.name,
            category=resource.category,
            matchStatus=match.matchStatus,
            matchedFactors=match.matchedFactors,
            missingInformation=match.missingInformation,
            whyThisMayFit=match.matchedFactors
            or ["CareBridge needs more intake information before matching this support pathway."],
            documentsToPrepare=details.get("documentsToPrepare", []),
            nextSteps=details.get("steps", [])[:1],
            sources=[],
            evidenceStatus="insufficient",
        )

    @staticmethod
    def _build_action_plan(recommendations: list[SupportRecommendation]) -> list[ActionPlanItem]:
        items = []
        for index, recommendation in enumerate(recommendations, start=1):
            items.append(
                ActionPlanItem(
                    priority=index,
                    title=recommendation.nextSteps[0] if recommendation.nextSteps else f"Review {recommendation.title}",
                    timeframe="today" if index == 1 else "this_week",
                    checklist=[
                        *recommendation.documentsToPrepare[:2],
                        "Write down questions before calling.",
                    ],
                )
            )
        return items

    @staticmethod
    def _build_questions() -> dict[str, list[str]]:
        return {
            "doctor": ["What support should we prioritize after discharge?"],
            "therapist": ["Is home-based therapy worth discussing?"],
            "socialWorker": ["Are transportation or caregiver support programs available?"],
            "insuranceProvider": ["Does this plan cover transportation or home-based support discussions?"],
        }
