from app.schemas.recommendation import RuleMatchResult


class RuleMatchingService:
    def match_profile(self, profile: dict) -> list[RuleMatchResult]:
        matches: list[RuleMatchResult] = []
        mobility = profile.get("mobility")
        transportation = profile.get("transportation")
        caregiver_burden = profile.get("caregiverBurden")
        caregiver_working = profile.get("caregiverWorking")
        discharge_time = profile.get("dischargeTime")

        if mobility in {"needs_some_assistance", "needs_substantial_assistance"}:
            factors = ["Mobility support was reported as a current need."]
            if discharge_time in {"less_than_7_days", "one_to_four_weeks"}:
                factors.append("Recent discharge can make rehabilitation follow-up time-sensitive.")
            matches.append(
                RuleMatchResult(
                    resourceId="rehab_services",
                    matchStatus="likely_match",
                    matchedFactors=factors,
                    missingInformation=["Confirm whether outpatient or home-based therapy has already been scheduled."],
                )
            )
        elif self._missing(mobility):
            matches.append(
                RuleMatchResult(
                    resourceId="rehab_services",
                    matchStatus="more_info_needed",
                    matchedFactors=[],
                    missingInformation=["Tell CareBridge how much mobility support is needed."],
                )
            )

        if mobility == "needs_substantial_assistance":
            matches.append(
                RuleMatchResult(
                    resourceId="home_health_discussion",
                    matchStatus="possible_match",
                    matchedFactors=["Substantial mobility assistance may make home-based support worth discussing."],
                    missingInformation=["Confirm whether the care team has discussed home-based services."],
                )
            )

        if transportation in {"no_vehicle", "cannot_drive", "need_support"}:
            matches.append(
                RuleMatchResult(
                    resourceId="transportation_assistance",
                    matchStatus="possible_match",
                    matchedFactors=["Transportation is a barrier to follow-up care."],
                    missingInformation=["Confirm whether the insurance plan covers non-emergency medical transportation."],
                )
            )
        elif self._missing(transportation):
            matches.append(
                RuleMatchResult(
                    resourceId="transportation_assistance",
                    matchStatus="more_info_needed",
                    matchedFactors=[],
                    missingInformation=["Tell CareBridge whether transportation is a barrier."],
                )
            )

        caregiver_factors = []
        if caregiver_burden in {"elevated", "high"}:
            caregiver_factors.append("Caregiver burden was marked as elevated or high.")
        if caregiver_working is True:
            caregiver_factors.append("The caregiver is balancing work responsibilities.")
        if caregiver_factors:
            matches.append(
                RuleMatchResult(
                    resourceId="caregiver_support_programs",
                    matchStatus="possible_match",
                    matchedFactors=caregiver_factors,
                    missingInformation=["Confirm available respite, local nonprofit, or county caregiver support options."],
                )
            )
        elif self._missing(caregiver_burden):
            matches.append(
                RuleMatchResult(
                    resourceId="caregiver_support_programs",
                    matchStatus="more_info_needed",
                    matchedFactors=[],
                    missingInformation=["Tell CareBridge how heavy the caregiving load feels this week."],
                )
            )

        return matches

    @staticmethod
    def _missing(value: object) -> bool:
        return value is None or value == "not_sure"
