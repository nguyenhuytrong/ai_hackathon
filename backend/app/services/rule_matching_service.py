from collections import defaultdict
from dataclasses import dataclass
from typing import Any

from app.db.models import EligibilityRule, Resource
from app.schemas.recommendation import RuleMatchResult


@dataclass(frozen=True)
class MissingRule:
    resource_id: str
    field_name: str
    message: str


MISSING_RULES = [
    MissingRule("rehab_services", "mobility", "Tell CareBridge how much mobility support is needed."),
    MissingRule("transportation_assistance", "transportation", "Tell CareBridge whether transportation is a barrier."),
    MissingRule("caregiver_support_programs", "caregiverBurden", "Tell CareBridge how heavy the caregiving load feels this week."),
]

RESOURCE_MISSING_DETAILS = {
    "rehab_services": ["Confirm whether outpatient or home-based therapy has already been scheduled."],
    "home_health_discussion": ["Confirm whether the care team has discussed home-based services."],
    "transportation_assistance": ["Confirm whether the insurance plan covers non-emergency medical transportation."],
    "caregiver_support_programs": ["Confirm available respite, local nonprofit, or county caregiver support options."],
}

LIKELY_MATCH_RESOURCES = {"rehab_services"}
REQUIRED_RULE_IDS = {"rehab_services": {"rule_rehab_mobility"}}


class RuleMatchingService:
    """Small DB-backed rule engine for the MVP.

    The seed data defines the actual rule conditions. This service evaluates those
    rules instead of hard-coding each support program in RecommendationService.
    """

    def match(self, *, profile: dict, resources: list[Resource], rules: list[EligibilityRule]) -> list[RuleMatchResult]:
        resource_map = {resource.id: resource for resource in resources}
        grouped_rules: dict[str, list[EligibilityRule]] = defaultdict(list)
        for rule in rules:
            if rule.resource_id in resource_map:
                grouped_rules[rule.resource_id].append(rule)

        matches: list[RuleMatchResult] = []
        for resource_id in resource_map:
            matched_rules = [rule for rule in grouped_rules[resource_id] if self._rule_matches(profile, rule)]
            if matched_rules and self._has_required_rules(resource_id, matched_rules):
                matches.append(
                    RuleMatchResult(
                        resourceId=resource_id,
                        matchStatus=self._match_status(resource_id),
                        matchedFactors=[rule.plain_reason for rule in matched_rules],
                        missingInformation=RESOURCE_MISSING_DETAILS.get(resource_id, []),
                        reasonCodes=[rule.id for rule in matched_rules],
                    )
                )

        existing_ids = {match.resourceId for match in matches}
        for missing_rule in MISSING_RULES:
            if missing_rule.resource_id in existing_ids:
                continue
            if self._missing(profile.get(missing_rule.field_name)):
                matches.append(
                    RuleMatchResult(
                        resourceId=missing_rule.resource_id,
                        matchStatus="more_info_needed",
                        matchedFactors=[],
                        missingInformation=[missing_rule.message],
                        reasonCodes=[f"missing_{missing_rule.field_name}"],
                    )
                )

        return matches

    @staticmethod
    def _has_required_rules(resource_id: str, matched_rules: list[EligibilityRule]) -> bool:
        required = REQUIRED_RULE_IDS.get(resource_id)
        if not required:
            return True
        return required.issubset({rule.id for rule in matched_rules})

    @staticmethod
    def _match_status(resource_id: str) -> str:
        return "likely_match" if resource_id in LIKELY_MATCH_RESOURCES else "possible_match"

    @staticmethod
    def _missing(value: object) -> bool:
        return value is None or value == "not_sure"

    def _rule_matches(self, profile: dict, rule: EligibilityRule) -> bool:
        actual = profile.get(rule.field_name)
        expected = rule.expected_value
        operator = rule.operator
        if operator == "equals":
            return actual == expected
        if operator == "in":
            return actual in set(expected or [])
        if operator == "is_true":
            return actual is True
        if operator == "exists":
            return actual is not None and actual != ""
        return False
