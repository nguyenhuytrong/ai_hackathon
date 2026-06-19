"""
database.py — Lightweight SQLite persistence (stdlib only, no ORM).

Schema:
    assessments(patient_id TEXT PK, data JSON, created_at TEXT)

Stores the full AssessmentResponse as a JSON blob so schema changes
don't require migrations during early development.
"""

import json
import sqlite3
import os
from datetime import datetime, timezone
from models import AssessmentResponse

# Read DB path from environment; default to local file
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./carebridge.db")
DB_PATH = DATABASE_URL.replace("sqlite:///", "")


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tables if they don't exist. Called once at app startup."""
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS assessments (
                patient_id  TEXT PRIMARY KEY,
                data        TEXT NOT NULL,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            )
        """)
        conn.commit()


def save_assessment(response: AssessmentResponse) -> None:
    """
    Upsert an AssessmentResponse.
    If the patient already has a record it is overwritten (latest wins).
    """
    now = datetime.now(timezone.utc).isoformat()
    payload = response.model_dump_json()

    with _connect() as conn:
        conn.execute("""
            INSERT INTO assessments (patient_id, data, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(patient_id) DO UPDATE SET
                data       = excluded.data,
                updated_at = excluded.updated_at
        """, (response.patient_id, payload, now, now))
        conn.commit()


def get_assessment(patient_id: str) -> AssessmentResponse | None:
    """Return the stored AssessmentResponse, or None if not found."""
    with _connect() as conn:
        row = conn.execute(
            "SELECT data FROM assessments WHERE patient_id = ?",
            (patient_id,)
        ).fetchone()

    if row is None:
        return None

    return AssessmentResponse.model_validate_json(row["data"])


def list_assessments(limit: int = 50) -> list[AssessmentResponse]:
    """Return the most recent `limit` assessments (newest first)."""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT data FROM assessments ORDER BY updated_at DESC LIMIT ?",
            (limit,)
        ).fetchall()

    return [AssessmentResponse.model_validate_json(r["data"]) for r in rows]
