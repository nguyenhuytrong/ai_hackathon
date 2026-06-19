"""
rule_engine.py — Pure-Python, deterministic risk scoring.

No API calls. Fast. Fully testable.
Returns a RiskScores object that feeds both the LLM prompt and the DB record.
"""

from models import AssessmentRequest, MobilityLevel, RiskLevel, RiskScores


def _score(points: int, low: int, high: int) -> RiskLevel:
    """Convert a raw point total to LOW / MEDIUM / HIGH."""
    if points <= low:
        return RiskLevel.LOW
    if points <= high:
        return RiskLevel.MEDIUM
    return RiskLevel.HIGH


def _transportation_barrier(req: AssessmentRequest) -> RiskLevel:
    """
    HIGH   — no transport + can't self-drive (mobility impaired)
    MEDIUM — no transport but mobile enough to arrange alternatives
    LOW    — has transport
    """
    if req.has_transport:
        return RiskLevel.LOW

    # No transport — how mobile are they?
    immobile = req.mobility_level in (
        MobilityLevel.WHEELCHAIR,
        MobilityLevel.BEDBOUND,
        MobilityLevel.ASSISTED,
    )
    return RiskLevel.HIGH if immobile else RiskLevel.MEDIUM


def _rehab_followup_risk(req: AssessmentRequest) -> RiskLevel:
    pts = 0

    if not req.pt_scheduled:
        pts += 2                                        # biggest driver

    if req.mobility_level in (MobilityLevel.ASSISTED,
                               MobilityLevel.WHEELCHAIR,
                               MobilityLevel.BEDBOUND):
        pts += 2                                        # needs PT the most

    if req.days_since_discharge <= 7:
        pts += 1                                        # critical early window

    if not req.has_transport:
        pts += 1                                        # can't easily get there

    # 0-1 → LOW, 2-3 → MEDIUM, 4+ → HIGH
    return _score(pts, low=1, high=3)


def _medication_adherence_risk(req: AssessmentRequest) -> RiskLevel:
    """
    Note: for medication risk, LOW = good (no missed doses).
    """
    pts = 0

    if req.missing_medications:
        pts += 3                                        # already missing doses

    if not req.has_caregiver:
        pts += 1                                        # no one to double-check

    if not req.has_insurance:
        pts += 1                                        # cost barrier

    return _score(pts, low=0, high=2)


def _caregiver_burden(req: AssessmentRequest) -> RiskLevel:
    pts = 0

    if not req.has_caregiver:
        # No caregiver at all — patient is alone, flag as HIGH
        return RiskLevel.HIGH

    # Caregiver exists — assess how much they're handling
    if req.mobility_level in (MobilityLevel.WHEELCHAIR, MobilityLevel.BEDBOUND):
        pts += 2
    elif req.mobility_level == MobilityLevel.ASSISTED:
        pts += 1

    if not req.has_transport:
        pts += 1                                        # logistics fall to caregiver

    if req.missing_medications:
        pts += 1                                        # medication management stress

    if req.caregiver_notes:
        # Simple heuristic: distress keywords bump score
        distress_words = {"tired", "worried", "overwhelmed", "exhausted",
                          "scared", "cannot", "can't", "hard", "difficult"}
        note_words = set(req.caregiver_notes.lower().split())
        if note_words & distress_words:
            pts += 1

    return _score(pts, low=1, high=2)


# ── Public API ────────────────────────────────────────────────────────────────

def score_risks(req: AssessmentRequest) -> RiskScores:
    """Entry point called by main.py."""
    return RiskScores(
        transportation_barrier=_transportation_barrier(req),
        rehab_followup_risk=_rehab_followup_risk(req),
        medication_adherence=_medication_adherence_risk(req),
        caregiver_burden=_caregiver_burden(req),
    )
