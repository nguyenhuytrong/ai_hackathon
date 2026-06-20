# CareBridge Navigator — Database Schema

## 1. Database Overview

CareBridge Navigator uses PostgreSQL as the main database.

The database supports:

- Intake sessions
- Caregiver profile JSON
- Resources / support pathways
- Simple eligibility/support rules
- Source documents
- Document chunks
- Vector embeddings
- Recommendation runs
- Optional Rehab Snapshot summaries

For the MVP, PostgreSQL + pgvector is preferred so structured data and vector data can live in one database.

Qdrant is an optional future or stretch-goal vector database.

Schema conventions:

- Use snake_case table and column names.
- Store timestamps in UTC.
- Store enum values as lowercase strings.
- Use JSONB for flexible hackathon profile data.
- Use explicit IDs such as `sess_123`, `src_123`, or UUIDs.
- Do not store real sensitive patient data for demo unless explicitly approved.

---

## 2. Entity Relationship Overview

```text
intake_sessions
  ├── recommendation_runs
  └── rehab_snapshots

resources
  ├── eligibility_rules
  ├── resource_sources
  └── document_chunks

source_documents
  └── document_chunks

document_chunks
  └── vector embedding
```

Main relationships:

- One intake session can have many recommendation runs.
- One resource can have many eligibility rules.
- One source document can have many chunks.
- One resource can be linked to many source documents.
- One recommendation run stores a snapshot of generated results.

---

## 3. Intake Session

Represents a temporary user/caregiver session.

Suggested table: `intake_sessions`

Important fields:

- id
- profile_json
- demo_mode
- created_at
- updated_at

Example `profile_json`:

```json
{
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
```

Suggested columns:

```text
id                  text primary key
profile_json        jsonb not null default '{}'
demo_mode           boolean not null default false
created_at          timestamptz not null
updated_at          timestamptz not null
```

Important indexes:

- Index on `created_at`
- Optional GIN index on `profile_json`

Notes:

- MVP can store intake data as JSONB for speed.
- Future versions can normalize patient/caregiver profiles into separate tables.

---

## 4. Resource

Represents a support pathway or public/community/healthcare resource.

Suggested table: `resources`

Important fields:

- id
- name
- category
- description
- location_label
- state
- county
- source_type
- official_url
- active
- created_at
- updated_at

Categories:

- `rehab`
- `transportation`
- `home_health`
- `caregiver_support`
- `food_support`
- `medication_support`
- `emergency_relief`
- `general`

Suggested columns:

```text
id                  text primary key
name                text not null
category            text not null
description         text not null
location_label      text
state               text
county              text
source_type         text
official_url        text
active              boolean not null default true
created_at          timestamptz not null
updated_at          timestamptz not null
```

Important indexes:

- Index on `category`
- Index on `state`
- Index on `county`
- Index on `active`

Important rules:

- A resource can represent a formal public benefit, healthcare support pathway, nonprofit support, or local service.
- Resource cards must not imply final eligibility.
- Resource details should link to source evidence where possible.

---

## 5. Eligibility Rule

Represents simple deterministic matching logic for a resource.

Suggested table: `eligibility_rules`

Important fields:

- id
- resource_id
- field_name
- operator
- expected_value
- rule_type
- plain_reason
- created_at
- updated_at

Rule types:

- `required`
- `supporting`
- `missing_info`
- `exclusion`

Operators:

- `equals`
- `not_equals`
- `in`
- `not_in`
- `exists`
- `is_true`
- `is_false`

Suggested columns:

```text
id                  text primary key
resource_id         text not null references resources(id)
field_name          text not null
operator            text not null
expected_value      jsonb
rule_type           text not null
plain_reason        text not null
created_at          timestamptz not null
updated_at          timestamptz not null
```

Example:

```json
{
  "resource_id": "transportation_assistance",
  "field_name": "transportation",
  "operator": "in",
  "expected_value": ["no_vehicle", "cannot_drive", "need_support"],
  "rule_type": "supporting",
  "plain_reason": "You reported difficulty getting to appointments."
}
```

Important indexes:

- Index on `resource_id`
- Index on `field_name`
- Index on `rule_type`

Important rules:

- Rules create possible matches, not final eligibility.
- Missing required fields should return `more_info_needed`.
- Supporting matches can increase recommendation priority.
- Rules should be easy to understand and explain in UI.

---

## 6. Source Document

Represents a trusted PDF, webpage, or manually curated source.

Suggested table: `source_documents`

Important fields:

- id
- title
- source_url
- source_type
- publisher
- authority_level
- state
- county
- category
- uploaded_at
- verified_at
- content_hash

Source types:

- `pdf`
- `webpage`
- `manual`

Authority levels:

- `official_government`
- `official_healthcare`
- `recognized_nonprofit`
- `secondary`
- `unknown`

Suggested columns:

```text
id                  text primary key
title               text not null
source_url          text
source_type         text not null
publisher           text
authority_level     text not null
state               text
county              text
category            text
uploaded_at         timestamptz not null
verified_at         timestamptz
content_hash        text
```

Important indexes:

- Index on `source_type`
- Index on `authority_level`
- Index on `state`
- Index on `county`
- Index on `category`

Important rules:

- Prefer official government or healthcare sources.
- Source metadata must be preserved for citations.
- Do not let LLM invent source URLs.
- Backend should map citation IDs to stored source metadata.

---

## 7. Document Chunk

Represents a chunk of text extracted from a source document.

Suggested table: `document_chunks`

Important fields:

- id
- source_document_id
- resource_id
- chunk_text
- page_number
- section_title
- metadata_json
- embedding
- created_at

Suggested columns with pgvector:

```text
id                      text primary key
source_document_id      text not null references source_documents(id)
resource_id             text references resources(id)
chunk_text              text not null
page_number             integer
section_title           text
metadata_json           jsonb not null default '{}'
embedding               vector
created_at              timestamptz not null
```

Important indexes:

- Index on `source_document_id`
- Index on `resource_id`
- Index on `page_number`
- Optional vector index on `embedding`
- Optional GIN index on `metadata_json`

Metadata example:

```json
{
  "category": "transportation",
  "state": "OH",
  "county": "Montgomery",
  "authorityLevel": "official_government",
  "sourceTitle": "Transportation Assistance Guide",
  "sourceUrl": "https://example.gov/transportation-guide.pdf"
}
```

Important rules:

- Every chunk must retain source metadata.
- Every recommendation source citation should refer to a chunk/source in this table.
- Chunk text should be clean and useful, not raw HTML or unreadable PDF extraction.
- Store page number when available.

---

## 8. Resource Source Link Optional

If a many-to-many relationship is needed between resources and sources, use:

Suggested table: `resource_sources`

Fields:

```text
resource_id             text references resources(id)
source_document_id      text references source_documents(id)
relationship_type       text
created_at              timestamptz not null
```

Relationship types:

- `primary`
- `supporting`
- `definition`
- `application_steps`

For MVP, this can be skipped if `document_chunks.resource_id` is enough.

---

## 9. Recommendation Run

Stores generated recommendation results for a session.

Suggested table: `recommendation_runs`

Important fields:

- id
- session_id
- input_snapshot
- result_json
- created_at

Suggested columns:

```text
id                  text primary key
session_id          text not null references intake_sessions(id)
input_snapshot      jsonb not null
result_json         jsonb not null
created_at          timestamptz not null
```

Important indexes:

- Index on `session_id`
- Index on `created_at`

Important rules:

- Store a snapshot of profile and output.
- Do not rely only on frontend state.
- Recommendation output should include sources, match status, action plan, and disclaimer.
- Future versions can store recommendations in normalized tables.

---

## 10. Rehab Snapshot

Stores summarized output from Module 2.

Suggested table: `rehab_snapshots`

Important fields:

- id
- session_id
- mobility_concern
- observations_json
- confidence
- captured_at
- created_at

Mobility concern:

- `low`
- `moderate`
- `high`
- `unable_to_assess`

Suggested columns:

```text
id                  text primary key
session_id          text not null references intake_sessions(id)
mobility_concern    text not null
observations_json   jsonb not null default '[]'
confidence          text
captured_at         timestamptz
created_at          timestamptz not null
```

Important indexes:

- Index on `session_id`
- Index on `mobility_concern`
- Index on `created_at`

Important rules:

- Rehab Snapshot is a supporting signal only.
- Do not store raw video in Module 1.
- Do not use Rehab Snapshot as a diagnosis.
- Do not determine final eligibility based on Rehab Snapshot.

---

## 11. Suggested SQL Skeleton

```sql
create table intake_sessions (
    id text primary key,
    profile_json jsonb not null default '{}',
    demo_mode boolean not null default false,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table resources (
    id text primary key,
    name text not null,
    category text not null,
    description text not null,
    location_label text,
    state text,
    county text,
    source_type text,
    official_url text,
    active boolean not null default true,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table eligibility_rules (
    id text primary key,
    resource_id text not null references resources(id),
    field_name text not null,
    operator text not null,
    expected_value jsonb,
    rule_type text not null,
    plain_reason text not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table source_documents (
    id text primary key,
    title text not null,
    source_url text,
    source_type text not null,
    publisher text,
    authority_level text not null,
    state text,
    county text,
    category text,
    uploaded_at timestamptz not null,
    verified_at timestamptz,
    content_hash text
);

create table document_chunks (
    id text primary key,
    source_document_id text not null references source_documents(id),
    resource_id text references resources(id),
    chunk_text text not null,
    page_number integer,
    section_title text,
    metadata_json jsonb not null default '{}',
    embedding vector,
    created_at timestamptz not null
);

create table recommendation_runs (
    id text primary key,
    session_id text not null references intake_sessions(id),
    input_snapshot jsonb not null,
    result_json jsonb not null,
    created_at timestamptz not null
);

create table rehab_snapshots (
    id text primary key,
    session_id text not null references intake_sessions(id),
    mobility_concern text not null,
    observations_json jsonb not null default '[]',
    confidence text,
    captured_at timestamptz,
    created_at timestamptz not null
);
```

Note:

- The `vector` type requires pgvector.
- If pgvector is not installed, store embeddings externally or temporarily skip the vector column while building the rest of the MVP.

---

## 12. Database Safety Rules

- Do not store raw API keys.
- Do not store raw patient documents unless explicitly needed.
- Do not store raw rehab videos in Module 1.
- Do not store real patient data for demo.
- Do not let LLM-generated citations bypass stored source records.
- Do not rename/drop fields without explicit approval.
- Keep schema simple for hackathon speed.
- Prefer JSONB for fast iteration where strict normalization is not needed.
- Move to normalized tables later if the project grows.
