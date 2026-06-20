from app.schemas.recommendation import RuleMatchResult


class RuleMatchingService:
    def match_profile(self, profile: dict, rehab_snapshot: dict | None = None) -> list[RuleMatchResult]:
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

        return self._apply_rehab_snapshot(matches, rehab_snapshot)

    @staticmethod
    def _missing(value: object) -> bool:
        return value is None or value == "not_sure"

    def _apply_rehab_snapshot(
        self,
        matches: list[RuleMatchResult],
        rehab_snapshot: dict | None,
    ) -> list[RuleMatchResult]:
        if not rehab_snapshot:
            return matches

        concern = rehab_snapshot.get("mobilityConcern")
        if concern not in {"moderate", "high"}:
            return matches

        snapshot_factors = [
            f"Mobility snapshot observed {concern} mobility concern.",
            *rehab_snapshot.get("observations", []),
        ]
        matches = self._upsert_match(
            matches,
            RuleMatchResult(
                resourceId="rehab_services",
                matchStatus="possible_match",
                matchedFactors=snapshot_factors,
                missingInformation=["Confirm the mobility snapshot observations with the care team."],
            ),
        )

        if concern == "high":
            matches = self._upsert_match(
                matches,
                RuleMatchResult(
                    resourceId="home_health_discussion",
                    matchStatus="possible_match",
                    matchedFactors=snapshot_factors,
                    missingInformation=["Ask whether home-based support or mobility equipment should be discussed."],
                ),
            )

        priority_order = ["rehab_services", "home_health_discussion"] if concern == "high" else ["rehab_services"]
        prioritized = []
        remaining = matches.copy()
        for resource_id in priority_order:
            match = next((candidate for candidate in remaining if candidate.resourceId == resource_id), None)
            if match:
                prioritized.append(match)
                remaining.remove(match)
        return prioritized + remaining

    @staticmethod
    def _upsert_match(matches: list[RuleMatchResult], snapshot_match: RuleMatchResult) -> list[RuleMatchResult]:
        updated = []
        replaced = False
        for match in matches:
            if match.resourceId != snapshot_match.resourceId:
                updated.append(match)
                continue

            existing_factors = list(match.matchedFactors)
            for factor in snapshot_match.matchedFactors:
                if factor not in existing_factors:
                    existing_factors.append(factor)
            missing_information = list(match.missingInformation)
            for item in snapshot_match.missingInformation:
                if item not in missing_information:
                    missing_information.append(item)
            updated.append(
                RuleMatchResult(
                    resourceId=match.resourceId,
                    matchStatus=(
                        snapshot_match.matchStatus
                        if match.matchStatus == "more_info_needed"
                        else match.matchStatus
                    ),
                    matchedFactors=existing_factors,
                    missingInformation=missing_information,
                )
            )
            replaced = True

        if not replaced:
            updated.append(snapshot_match)
        return updated
