from app.db.models import Resource


class RagQueryBuilder:
    """Build focused retrieval queries from profile + resource instead of searching raw JSON."""

    def build_for_resource(self, *, profile: dict, resource: Resource, matched_factors: list[str]) -> str:
        parts = [resource.name, resource.category, "stroke discharge caregiver support"]
        state = profile.get("state")
        county = profile.get("county")
        insurance = profile.get("insurance")
        biggest_challenge = profile.get("biggestChallenge")

        if state:
            parts.append(str(state))
        if county:
            parts.append(f"{county} County")
        if insurance:
            parts.append(str(insurance))
        if biggest_challenge:
            parts.append(str(biggest_challenge).replace("_", " "))
        parts.extend(matched_factors[:3])
        return " ".join(part for part in parts if part)
