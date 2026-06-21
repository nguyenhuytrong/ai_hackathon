from app.schemas.rehab_snapshot import RehabSnapshotReport, RehabSnapshotReportRequest


class RehabSnapshotService:
    def generate_report(self, request: RehabSnapshotReportRequest) -> RehabSnapshotReport:
        return RehabSnapshotReport(
            caregiverSummary=self._caregiver_summary(request),
            clinicalFlags=self._clinical_flags(request),
            nextSteps=self._next_steps(),
        )

    @staticmethod
    def _caregiver_summary(request: RehabSnapshotReportRequest) -> str:
        observations = []
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
            score_text = f" The overall movement signal was {request.cms.CMS:.1f} on the demo scoring scale."

        return (
            f"CareBridge observed that {', '.join(observations)}."
            f"{score_text} These observations are a support-planning signal to discuss with the care team, not a diagnosis."
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
                flags.append(f"Balance task signal recorded at {breakdown.balance:.1f}.")

        if raw and raw.arm and raw.arm.asymmetryDeg is not None:
            flags.append(f"Arm raise asymmetry observed at {raw.arm.asymmetryDeg:.0f} degrees.")
        if raw and raw.sit and raw.sit.avgTimeSec is not None:
            flags.append(f"Average sit-to-stand time observed at {raw.sit.avgTimeSec:.1f} seconds.")
        if raw and raw.balance and raw.balance.durationSec is not None:
            flags.append(f"Standing balance duration observed at {raw.balance.durationSec:.0f} seconds.")

        return flags or ["Mobility observations are available for care-team review."]

    @staticmethod
    def _next_steps() -> list[str]:
        return [
            "Share these observations with the therapist, discharge planner, or primary care team.",
            "Ask whether rehab follow-up, home safety, or transportation support is worth discussing.",
            "Use the support plan to prepare questions and documents before the next appointment.",
        ]
