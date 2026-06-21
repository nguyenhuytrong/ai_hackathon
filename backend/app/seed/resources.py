from app.db.models import EligibilityRule, Resource
from app.db.repositories import ResourceRepository


RESOURCE_SEEDS = [
    {
        "id": "rehab_services",
        "name": "Rehabilitation Services",
        "category": "rehab",
        "description": "Support pathway for confirming therapy follow-up after stroke discharge.",
        "location_label": "Montgomery County, OH",
        "state": "OH",
        "county": "Montgomery",
        "source_type": "manual",
        "official_url": None,
        "details_json": {
            "eligibilityFactors": ["Recent discharge", "Mobility support need", "Therapy follow-up planning"],
            "documentsToPrepare": ["Discharge summary", "Therapy referral", "Insurance card"],
            "steps": [
                "Call the clinic or discharge planner to confirm the first rehabilitation appointment.",
                "Ask whether outpatient or home-based therapy is worth discussing.",
            ],
        },
        "rules": [
            {
                "id": "rule_rehab_mobility",
                "field_name": "mobility",
                "operator": "in",
                "expected_value": ["needs_some_assistance", "needs_substantial_assistance"],
                "rule_type": "supporting",
                "plain_reason": "Mobility support was reported as a current need.",
            },
            {
                "id": "rule_rehab_discharge",
                "field_name": "dischargeTime",
                "operator": "in",
                "expected_value": ["less_than_7_days", "one_to_four_weeks"],
                "rule_type": "supporting",
                "plain_reason": "Recent discharge can make rehabilitation follow-up time-sensitive.",
            },
        ],
    },
    {
        "id": "home_health_discussion",
        "name": "Home Health Discussion",
        "category": "home_health",
        "description": "Support pathway for asking whether home-based care should be discussed.",
        "location_label": "Montgomery County, OH",
        "state": "OH",
        "county": "Montgomery",
        "source_type": "manual",
        "official_url": None,
        "details_json": {
            "eligibilityFactors": ["Substantial mobility assistance", "Recent discharge", "Home safety concerns"],
            "documentsToPrepare": ["Discharge summary", "Insurance card", "Medication list"],
            "steps": [
                "Ask the doctor, therapist, or discharge planner whether home health is worth discussing.",
                "Prepare current mobility concerns before the call.",
            ],
        },
        "rules": [
            {
                "id": "rule_home_health_mobility",
                "field_name": "mobility",
                "operator": "equals",
                "expected_value": "needs_substantial_assistance",
                "rule_type": "supporting",
                "plain_reason": "Substantial mobility assistance may make home-based support worth discussing.",
            }
        ],
    },
    {
        "id": "transportation_assistance",
        "name": "Transportation Assistance",
        "category": "transportation",
        "description": "Support pathway for getting to medical or rehabilitation appointments.",
        "location_label": "Montgomery County, OH",
        "state": "OH",
        "county": "Montgomery",
        "source_type": "manual",
        "official_url": None,
        "details_json": {
            "eligibilityFactors": ["Transportation difficulty", "Medical or rehabilitation appointment", "Local program availability"],
            "documentsToPrepare": ["Insurance card", "Appointment date", "Clinic address", "Discharge summary"],
            "steps": [
                "Ask the insurance provider or social worker about available transportation support.",
                "Write down appointment locations before calling.",
            ],
        },
        "rules": [
            {
                "id": "rule_transportation_barrier",
                "field_name": "transportation",
                "operator": "in",
                "expected_value": ["no_vehicle", "cannot_drive", "need_support"],
                "rule_type": "supporting",
                "plain_reason": "Transportation is a barrier to follow-up care.",
            }
        ],
    },
    {
        "id": "caregiver_support_programs",
        "name": "Caregiver Support Programs",
        "category": "caregiver_support",
        "description": "Support pathway for respite, community, or nonprofit caregiver help.",
        "location_label": "Montgomery County, OH",
        "state": "OH",
        "county": "Montgomery",
        "source_type": "manual",
        "official_url": None,
        "details_json": {
            "eligibilityFactors": ["Caregiver burden", "Caregiver work responsibilities", "Local support availability"],
            "documentsToPrepare": ["Caregiver contact information", "Care recipient discharge paperwork"],
            "steps": [
                "Ask the social worker which caregiver support programs are worth discussing.",
                "Describe work schedule and current caregiving pressure.",
            ],
        },
        "rules": [
            {
                "id": "rule_caregiver_burden",
                "field_name": "caregiverBurden",
                "operator": "in",
                "expected_value": ["elevated", "high"],
                "rule_type": "supporting",
                "plain_reason": "Caregiver burden was marked as elevated or high.",
            },
            {
                "id": "rule_caregiver_working",
                "field_name": "caregiverWorking",
                "operator": "is_true",
                "expected_value": True,
                "rule_type": "supporting",
                "plain_reason": "The caregiver is balancing work responsibilities.",
            },
        ],
    },
]


def seed_resources(repository: ResourceRepository) -> None:
    for seed in RESOURCE_SEEDS:
        repository.upsert_resource(
            Resource(
                id=seed["id"],
                name=seed["name"],
                category=seed["category"],
                description=seed["description"],
                location_label=seed["location_label"],
                state=seed["state"],
                county=seed["county"],
                source_type=seed["source_type"],
                official_url=seed["official_url"],
                active=True,
                details_json=seed["details_json"],
            )
        )

    repository.commit()

    for seed in RESOURCE_SEEDS:
        repository.replace_rules(
            seed["id"],
            [
                EligibilityRule(
                    id=rule["id"],
                    resource_id=seed["id"],
                    field_name=rule["field_name"],
                    operator=rule["operator"],
                    expected_value=rule["expected_value"],
                    rule_type=rule["rule_type"],
                    plain_reason=rule["plain_reason"],
                )
                for rule in seed["rules"]
            ],
        )

    repository.commit()