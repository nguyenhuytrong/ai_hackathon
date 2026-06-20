# CareBridge Navigator API Contract

## 1. Purpose

This file defines the REST contract between the React frontend and the FastAPI backend for **CareBridge Navigator**.

Use it for endpoint paths, request bodies, response bodies, enum values, error response shape, RAG response shape, recommendation shape, and Module 2 integration.

CareBridge Navigator helps post-stroke caregivers understand possible support options, eligibility factors, missing information, and next steps.

---

## 2. Base URL

- Local backend: `http://localhost:8000`
- API prefix: `/api/v1`

Example:

```text
http://localhost:8000/api/v1/sessions
```

---

## 3. General Rules

- MVP does not require user authentication unless the team adds it later.
- Timestamps use ISO-8601 strings.
- Request and response bodies use JSON.
- API responses should use the standard success/error wrapper.
- LLM-generated content must be validated before being returned to the frontend.
- The frontend must not call LLM APIs directly.
- API keys and secrets must stay on the backend.
- CareBridge must never say the user definitively qualifies for a benefit.
- Use `may qualify`, `may benefit`, `possible match`, or `more information needed`.

---

## 4. Standard Success Response

Object response:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

List response:

```json
{
  "success": true,
  "message": "Data loaded successfully",
  "data": []
}
```

---

## 5. Standard Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "status": 400,
  "path": "/api/v1/sessions",
  "timestamp": "2026-06-19T10:00:00Z",
  "errors": {
    "county": "County is required for local resource matching"
  }
}
```

Common status codes:

- `400` validation or business-rule failure
- `404` resource not found
- `409` conflicting session state
- `422` invalid request body
- `500` unexpected server error
- `503` AI/RAG provider unavailable

---

## 6. API Groups

```text
/api/v1/sessions
/api/v1/recommendations
/api/v1/resources
/api/v1/rag
/api/v1/sources
/api/v1/rehab-snapshot
/api/v1/health
```

---

## 7. Enum Values

### Discharge Time

- `less_than_7_days`
- `one_to_four_weeks`
- `more_than_one_month`
- `not_sure`

### Mobility Status

- `independent`
- `needs_some_assistance`
- `needs_substantial_assistance`
- `not_sure`

### Transportation Status

- `available`
- `no_vehicle`
- `cannot_drive`
- `need_support`
- `not_sure`

### Insurance Type

- `medicare`
- `medicaid`
- `private`
- `uninsured`
- `not_sure`

### Caregiver Burden

- `low`
- `moderate`
- `elevated`
- `high`
- `not_sure`

### Support Category

- `rehab`
- `transportation`
- `home_health`
- `caregiver_support`
- `food_support`
- `medication_support`
- `emergency_relief`
- `general`

### Match Status

- `likely_match`
- `possible_match`
- `more_info_needed`
- `not_matched`

### Source Type

- `pdf`
- `webpage`
- `manual`

### Authority Level

- `official_government`
- `official_healthcare`
- `recognized_nonprofit`
- `secondary`
- `unknown`

### Evidence Status

- `sufficient`
- `partial`
- `insufficient`

### Rehab Mobility Concern

- `low`
- `moderate`
- `high`
- `unable_to_assess`

---

## 8. Session API

### Create Session

`POST /api/v1/sessions`

Auth required: No

Request:

```json
{
  "demoMode": true
}
```

Response:

```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "sessionId": "sess_123",
    "profile": {},
    "createdAt": "2026-06-19T10:00:00Z"
  }
}
```

Possible errors:

- `500` session creation failed

---

### Get Session

`GET /api/v1/sessions/{sessionId}`

Auth required: No

Response:

```json
{
  "success": true,
  "message": "Session loaded successfully",
  "data": {
    "sessionId": "sess_123",
    "profile": {
      "dischargeTime": "less_than_7_days",
      "mobility": "needs_some_assistance",
      "transportation": "no_vehicle",
      "insurance": "medicaid",
      "caregiverWorking": true,
      "caregiverBurden": "elevated",
      "state": "OH",
      "county": "Montgomery"
    },
    "createdAt": "2026-06-19T10:00:00Z",
    "updatedAt": "2026-06-19T10:05:00Z"
  }
}
```

Possible errors:

- `404` session not found

---

### Update Intake Profile

`PATCH /api/v1/sessions/{sessionId}/intake`

Auth required: No

Request:

```json
{
  "dischargeTime": "less_than_7_days",
  "mobility": "needs_some_assistance",
  "transportation": "no_vehicle",
  "insurance": "medicaid",
  "caregiverWorking": true,
  "caregiverBurden": "elevated",
  "state": "OH",
  "county": "Montgomery",
  "biggestChallenge": "getting_to_appointments"
}
```

Response:

```json
{
  "success": true,
  "message": "Intake profile updated successfully",
  "data": {
    "sessionId": "sess_123",
    "profile": {
      "dischargeTime": "less_than_7_days",
      "mobility": "needs_some_assistance",
      "transportation": "no_vehicle",
      "insurance": "medicaid",
      "caregiverWorking": true,
      "caregiverBurden": "elevated",
      "state": "OH",
      "county": "Montgomery",
      "biggestChallenge": "getting_to_appointments"
    }
  }
}
```

Possible errors:

- `400` invalid enum value
- `404` session not found
- `422` invalid request body

---

### Load Demo Session

`POST /api/v1/sessions/demo`

Auth required: No

Purpose: creates a prefilled demo persona for hackathon presentation.

Response:

```json
{
  "success": true,
  "message": "Demo session created successfully",
  "data": {
    "sessionId": "demo_123",
    "profile": {
      "caregiverName": "John",
      "careRecipient": "Mother",
      "dischargeTime": "less_than_7_days",
      "mobility": "needs_some_assistance",
      "transportation": "no_vehicle",
      "insurance": "medicaid",
      "caregiverWorking": true,
      "caregiverBurden": "elevated",
      "state": "OH",
      "county": "Montgomery",
      "biggestChallenge": "getting_to_appointments"
    }
  }
}
```

---

## 9. Recommendation API

### Generate Recommendations

`POST /api/v1/sessions/{sessionId}/recommendations`

Auth required: No

Purpose:

1. Load intake profile.
2. Run simple rule matching.
3. Build retrieval queries.
4. Retrieve source evidence with RAG.
5. Generate structured recommendation JSON.
6. Save recommendation run.
7. Return support plan.

Request:

```json
{
  "includeRagEvidence": true,
  "regenerate": true
}
```

Response:

```json
{
  "success": true,
  "message": "Recommendations generated successfully",
  "data": {
    "runId": "rec_123",
    "summary": "Based on your situation, CareBridge found three support areas worth exploring.",
    "recommendations": [
      {
        "id": "transportation_assistance",
        "title": "Transportation Assistance",
        "category": "transportation",
        "matchStatus": "possible_match",
        "matchedFactors": [
          "You reported transportation difficulty.",
          "Follow-up appointments may require reliable transportation."
        ],
        "missingInformation": [
          "Confirm whether the insurance plan covers non-emergency medical transportation."
        ],
        "whyThisMayFit": [
          "Transportation may be important because the care recipient may need follow-up rehab appointments after discharge."
        ],
        "documentsToPrepare": [
          "Insurance card",
          "Appointment date",
          "Clinic address",
          "Discharge summary"
        ],
        "nextSteps": [
          "Ask the insurance provider or social worker about available transportation support."
        ],
        "sources": [
          {
            "sourceId": "src_transport_guide",
            "title": "Transportation Assistance Guide",
            "sourceType": "pdf",
            "url": "https://example.gov/transportation-guide.pdf",
            "page": 4,
            "excerpt": "Transportation support may be available for covered medical appointments."
          }
        ],
        "evidenceStatus": "partial"
      }
    ],
    "actionPlan": [
      {
        "priority": 1,
        "title": "Confirm rehabilitation follow-up",
        "timeframe": "today",
        "checklist": [
          "Call the clinic",
          "Confirm whether the referral was received",
          "Prepare insurance information"
        ]
      }
    ],
    "questionsToAsk": {
      "doctor": ["What changes should we watch for after discharge?"],
      "therapist": ["Is home-based therapy appropriate?"],
      "socialWorker": ["Are transportation services available?"],
      "insuranceProvider": ["Is transportation to rehab covered?"]
    },
    "disclaimer": "CareBridge does not determine final eligibility, provide medical advice, or replace healthcare professionals."
  }
}
```

Possible errors:

- `400` intake profile incomplete
- `404` session not found
- `503` AI/RAG service unavailable

---

### Get Latest Recommendations

`GET /api/v1/sessions/{sessionId}/recommendations/latest`

Auth required: No

Response:

```json
{
  "success": true,
  "message": "Latest recommendations loaded successfully",
  "data": {
    "runId": "rec_123",
    "summary": "Based on your situation, CareBridge found three support areas worth exploring.",
    "recommendations": [],
    "actionPlan": [],
    "questionsToAsk": {},
    "disclaimer": "CareBridge does not determine final eligibility, provide medical advice, or replace healthcare professionals."
  }
}
```

Possible errors:

- `404` session or recommendation run not found

---

## 10. Resource API

### Get Resources

`GET /api/v1/resources`

Auth required: No

Query params:

- `category`
- `matchStatus`
- `state`
- `county`
- `q`

Response:

```json
{
  "success": true,
  "message": "Resources loaded successfully",
  "data": [
    {
      "id": "transportation_assistance",
      "name": "Transportation Assistance",
      "category": "transportation",
      "description": "Support pathway for getting to medical or rehabilitation appointments.",
      "location": "Montgomery County, OH",
      "sourceType": "official_government",
      "officialUrl": "https://example.gov/transportation"
    }
  ]
}
```

---

### Get Resource Detail

`GET /api/v1/resources/{resourceId}`

Auth required: No

Response:

```json
{
  "success": true,
  "message": "Resource loaded successfully",
  "data": {
    "id": "transportation_assistance",
    "name": "Transportation Assistance",
    "category": "transportation",
    "description": "Support pathway for getting to medical or rehabilitation appointments.",
    "eligibilityFactors": [
      "Transportation difficulty",
      "Covered medical appointment",
      "Insurance or local program availability"
    ],
    "documentsToPrepare": [
      "Insurance card",
      "Appointment date",
      "Clinic address"
    ],
    "steps": [
      "Ask the insurance provider or social worker whether transportation support is available.",
      "Prepare appointment information before calling.",
      "Confirm how far in advance rides must be scheduled."
    ],
    "sources": [
      {
        "sourceId": "src_transport_guide",
        "title": "Transportation Assistance Guide",
        "url": "https://example.gov/transportation-guide.pdf",
        "sourceType": "pdf",
        "page": 4,
        "authorityLevel": "official_government"
      }
    ]
  }
}
```

Possible errors:

- `404` resource not found

---

## 11. RAG API

### Search Evidence

`POST /api/v1/rag/search`

Auth required: No

Purpose: debug and retrieve source chunks for a query.

Request:

```json
{
  "query": "transportation help for therapy appointments after stroke",
  "filters": {
    "category": "transportation",
    "state": "OH",
    "county": "Montgomery"
  },
  "topK": 5
}
```

Response:

```json
{
  "success": true,
  "message": "Evidence retrieved successfully",
  "data": {
    "query": "transportation help for therapy appointments after stroke",
    "results": [
      {
        "chunkId": "chunk_123",
        "score": 0.84,
        "text": "Transportation support may be available for covered medical appointments...",
        "source": {
          "sourceId": "src_transport_guide",
          "title": "Transportation Assistance Guide",
          "url": "https://example.gov/transportation-guide.pdf",
          "page": 4,
          "authorityLevel": "official_government"
        },
        "metadata": {
          "category": "transportation",
          "state": "OH",
          "county": "Montgomery"
        }
      }
    ]
  }
}
```

Possible errors:

- `400` invalid query
- `503` vector store or embedding provider unavailable

---

### Ask RAG Question

`POST /api/v1/rag/ask`

Auth required: No

Purpose: answers a follow-up question using retrieved evidence only.

Request:

```json
{
  "sessionId": "sess_123",
  "question": "What should I ask about transportation support?",
  "filters": {
    "category": "transportation"
  }
}
```

Response:

```json
{
  "success": true,
  "message": "Answer generated successfully",
  "data": {
    "answer": "You may want to ask whether transportation to rehabilitation appointments is covered, how far in advance rides must be scheduled, and what appointment information is required.",
    "evidenceStatus": "partial",
    "sources": [
      {
        "sourceId": "src_transport_guide",
        "title": "Transportation Assistance Guide",
        "url": "https://example.gov/transportation-guide.pdf",
        "page": 4,
        "excerpt": "Transportation support may be available for covered medical appointments."
      }
    ],
    "disclaimer": "This is not a final eligibility decision."
  }
}
```

Possible errors:

- `400` invalid question
- `404` session not found
- `503` AI/RAG service unavailable

---

## 12. Source API

### Get Source Detail

`GET /api/v1/sources/{sourceId}`

Auth required: No

Response:

```json
{
  "success": true,
  "message": "Source loaded successfully",
  "data": {
    "sourceId": "src_transport_guide",
    "title": "Transportation Assistance Guide",
    "url": "https://example.gov/transportation-guide.pdf",
    "sourceType": "pdf",
    "publisher": "Example County Agency",
    "authorityLevel": "official_government",
    "state": "OH",
    "county": "Montgomery",
    "uploadedAt": "2026-06-19T10:00:00Z",
    "chunks": [
      {
        "chunkId": "chunk_123",
        "page": 4,
        "sectionTitle": "Scheduling Transportation",
        "text": "Transportation support may be available for covered medical appointments."
      }
    ]
  }
}
```

Possible errors:

- `404` source not found

---

## 13. Rehab Snapshot Integration API

### Submit Rehab Snapshot

`POST /api/v1/sessions/{sessionId}/rehab-snapshot`

Auth required: No

Purpose: receives summarized output from Module 2. Module 1 uses this as a support signal only.

Request:

```json
{
  "mobilityConcern": "moderate",
  "observations": [
    "Difficulty standing",
    "Reduced arm movement"
  ],
  "confidence": "medium",
  "capturedAt": "2026-06-19T10:00:00Z"
}
```

Response:

```json
{
  "success": true,
  "message": "Rehab snapshot saved successfully",
  "data": {
    "sessionId": "sess_123",
    "rehabSnapshot": {
      "mobilityConcern": "moderate",
      "observations": [
        "Difficulty standing",
        "Reduced arm movement"
      ],
      "confidence": "medium"
    },
    "suggestedRecompute": true
  }
}
```

Possible errors:

- `400` invalid snapshot
- `404` session not found

---

## 14. Health API

### Health Check

`GET /api/v1/health`

Response:

```json
{
  "success": true,
  "message": "CareBridge API is healthy",
  "data": {
    "status": "ok"
  }
}
```

---

## 15. Important Response Rules

Recommendation responses must include:

- `matchStatus`
- `matchedFactors`
- `missingInformation`
- `whyThisMayFit`
- `documentsToPrepare`
- `nextSteps`
- `sources`
- `disclaimer`

Recommendation responses must not include:

- “You qualify.”
- Final eligibility decisions.
- Medical diagnosis.
- Medication changes.
- Invented sources.
- Raw chain-of-thought.

---

## 16. Future API Scope

Do not implement these unless the team explicitly expands the project:

- User authentication
- Admin source management UI
- Real benefit application submission
- Real healthcare provider messaging
- Real-time notifications
- Appointment scheduling integration
- Insurance API integration
- Long-term patient account storage
