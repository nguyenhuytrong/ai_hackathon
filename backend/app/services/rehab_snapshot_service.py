import json
import logging
from typing import Any

from app.core.config import get_settings
from app.schemas.rehab_snapshot import RehabSnapshotReport, RehabSnapshotReportRequest

logger = logging.getLogger(__name__)


class RehabSnapshotService:
    """Generate a safe caregiver-facing mobility snapshot.

    The service is deterministic by default so the hackathon demo does not depend on
    an external model. If REHAB_SNAPSHOT_LLM_ENABLED=true and GROQ_API_KEY is set,
    it will try Groq first and fall back to deterministic output on any failure.
    """

    def generate_report(self, request: RehabSnapshotReportRequest) -> RehabSnapshotReport:
        settings = get_settings()

        if settings.rehab_snapshot_llm_enabled and settings.groq_api_key:
            ai_report = self._try_generate_with_groq(request)
            if ai_report is not None:
                return ai_report

        return self._generate_deterministic_report(request)

    def _generate_deterministic_report(self, request: RehabSnapshotReportRequest) -> RehabSnapshotReport:
        return RehabSnapshotReport(
            caregiverSummary=self._caregiver_summary(request),
            clinicalFlags=self._clinical_flags(request),
            nextSteps=self._next_steps(request),
        )

    def _try_generate_with_groq(self, request: RehabSnapshotReportRequest) -> RehabSnapshotReport | None:
        settings = get_settings()
        try:
            from groq import Groq

            client = Groq(api_key=settings.groq_api_key)
            response = client.chat.completions.create(
                model=settings.rehab_snapshot_model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You create safe caregiver-facing mobility observation summaries. "
                            "Do not diagnose, do not assign official clinical scores, do not say urgent, "
                            "do not say the person qualifies for any benefit or treatment. "
                            "Return JSON only."
                        ),
                    },
                    {"role": "user", "content": self._build_llm_prompt(request)},
                ],
                max_tokens=700,
                temperature=0.2,
            )
            raw = response.choices[0].message.content or ""
            parsed = json.loads(self._clean_json(raw))
            return self._parse_ai_report(parsed)
        except Exception as exc:  # pragma: no cover - external fallback path
            logger.warning("Groq rehab snapshot generation failed; using deterministic fallback: %s", exc)
            return None

    @staticmethod
    def _build_llm_prompt(request: RehabSnapshotReportRequest) -> str:
        cms = request.cms
        raw = request.raw
        lines = ["Mobility observations for a stroke recovery support-planning demo:"]

        if cms:
            lines.append(f"- CareBridge movement signal: {cms.CMS:.2f}; severity label: {cms.severity}")
            if cms.breakdown:
                lines.append(
                    "- Signal breakdown: "
                    f"arm={cms.breakdown.arm}, sit={cms.breakdown.sit}, balance={cms.breakdown.balance}"
                )

        if raw and raw.sit:
            lines.append(f"- Sit-to-stand: {raw.sit.reps} reps; avg time={raw.sit.avgTimeSec}s")
        if raw and raw.arm:
            lines.append(
                "- Arm raise: "
                f"left={raw.arm.peakLeft}°, right={raw.arm.peakRight}°, "
                f"asymmetry={raw.arm.asymmetryDeg}°, weaker side={raw.arm.weakSide}"
            )
        if raw and raw.balance:
            lines.append(
                f"- Standing balance: duration={raw.balance.durationSec}s; sway={raw.balance.swayMagnitude}"
            )

        lines.append(
            """
Return valid JSON only with exactly this camelCase shape:
{
  "caregiverSummary": "2-3 compassionate plain-language sentences for family/caregiver",
  "clinicalFlags": ["observation 1", "observation 2"],
  "nextSteps": ["safe next step 1", "safe next step 2", "safe next step 3"]
}
Rules: no diagnosis, no official clinical score interpretation, no emergency/urgent wording, no treatment requirement, no eligibility promise.
""".strip()
        )
        return "\n".join(lines)

    @staticmethod
    def _clean_json(raw: str) -> str:
        value = raw.strip()
        if value.startswith("```"):
            value = value.strip("`").strip()
            if value.startswith("json"):
                value = value[4:].strip()
        return value

    @staticmethod
    def _parse_ai_report(parsed: dict[str, Any]) -> RehabSnapshotReport:
        return RehabSnapshotReport(
            caregiverSummary=str(parsed.get("caregiverSummary") or parsed.get("caregiver_summary") or ""),
            clinicalFlags=list(parsed.get("clinicalFlags") or parsed.get("clinical_flags") or []),
            nextSteps=list(parsed.get("nextSteps") or parsed.get("next_steps") or []),
        )

    @staticmethod
    def _caregiver_summary(request: RehabSnapshotReportRequest) -> str:
        observations: list[str] = []
        raw = request.raw

        if raw and raw.sit and raw.sit.reps is not None:
            observations.append(f"{raw.sit.reps} sit-to-stand repetitions were completed")
        if raw and raw.arm and raw.arm.asymmetryDeg is not None:
            side_text = f" on the {raw.arm.weakSide} side" if raw.arm.weakSide else ""
            observations.append(f"arm raise difference was observed{side_text}")
        if raw and raw.balance and raw.balance.swayMagnitude is not None:
            observations.append("standing balance movement was observed")

        if not observations:
            observations.append("mobility task observations were captured")

        score_text = ""
        if request.cms and request.cms.CMS is not None:
            score_text = f" The overall movement signal was {request.cms.CMS:.1f} on the CareBridge demo scale."

        return (
            f"CareBridge observed that {', '.join(observations)}."
            f"{score_text} These observations are support-planning signals to discuss with the care team, not a diagnosis."
        )

    @staticmethod
    def _clinical_flags(request: RehabSnapshotReportRequest) -> list[str]:
        flags: list[str] = []
        raw = request.raw

        if request.cms and request.cms.breakdown:
            breakdown = request.cms.breakdown
            if breakdown.arm is not None:
                flags.append(f"Arm task signal recorded at {breakdown.arm:.1f}.")
            if breakdown.sit is not None:
                flags.append(f"Sit-to-stand task signal recorded at {breakdown.sit:.1f}.")
            if breakdown.balance is not None:
                flags.append(f"Balance task signal recorded at {breakdown.balance:.3f}.")

        if raw and raw.arm and raw.arm.asymmetryDeg is not None:
            flags.append(f"Arm raise asymmetry observed at {raw.arm.asymmetryDeg:.0f} degrees.")
        if raw and raw.sit and raw.sit.avgTimeSec is not None:
            flags.append(f"Average sit-to-stand time observed at {raw.sit.avgTimeSec:.1f} seconds.")
        if raw and raw.balance and raw.balance.durationSec is not None:
            flags.append(f"Standing balance duration observed at {raw.balance.durationSec:.0f} seconds.")

        return flags or ["Mobility observations are available for care-team review."]

    @staticmethod
    def _next_steps(request: RehabSnapshotReportRequest) -> list[str]:
        steps = [
            "Share these observations with the therapist, discharge planner, or primary care team.",
            "Ask whether rehab follow-up, home safety, or transportation support is worth discussing.",
            "Use the CareBridge support plan to prepare questions and documents before the next appointment.",
        ]

        if request.cms and request.cms.severity in {"moderate impairment", "severe impairment"}:
            steps.insert(
                1,
                "Consider bringing up the mobility changes when prioritizing rehab, home-health, or caregiver support conversations.",
            )

        return steps[:4]
