from google import genai
import os
import json
from datetime import date, timedelta
from dotenv import load_dotenv

from db.postgres_client import get_connection

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY", "")
if _api_key:
    client = genai.Client(api_key=_api_key)
else:
    client = None


def generate_tasks_from_note(note_id: int) -> list[dict]:
    """Fetch all chunks for a note from PostgreSQL, call Gemini to generate study tasks."""

    if not client:
        raise ValueError("GEMINI_API_KEY is not configured. Add it to your .env file.")

    # ── 1. Fetch all chunks from PostgreSQL ───────────────────────────
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT content FROM notes_chunks WHERE note_id = %s ORDER BY chunk_index",
            (note_id,),
        )
        rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        raise ValueError(
            f"No content found for note {note_id}. "
            "The note may still be processing — try again in a moment."
        )

    # Concatenate up to ~4000 words to stay within context limits
    all_text = " ".join(row[0] for row in rows)
    if len(all_text) > 16000:
        all_text = all_text[:16000] + "..."

    # ── 2. Compute spread-out due dates (today + 1..7 days) ──────────
    today = date.today()
    date_slots = [(today + timedelta(days=i)).isoformat() for i in range(1, 8)]

    # ── 3. Ask Gemini to generate structured tasks ────────────────────
    prompt = f"""You are an expert study planner for students.

Based on the following study material, generate 5 to 7 structured study tasks that will help a student fully understand and learn the content. Each task should be actionable, specific, and progressively build on the previous one.

Study Material:
{all_text}

Return ONLY a valid JSON array (no markdown, no code fences) with this exact structure:
[
  {{
    "title": "Short task title (max 10 words)",
    "description": "Clear description of what the student should do (1-2 sentences)",
    "due_date": "YYYY-MM-DD",
    "priority": "high | medium | low"
  }}
]

Rules:
- Spread due_date across these available dates (pick from them): {date_slots}
- First 2 tasks should be "high" priority (reading/understanding core concepts)
- Middle tasks should be "medium" priority (practice/apply)
- Last task should be "low" priority (review/summarize)
- Make tasks specific to the actual content, not generic"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    raw = response.text.strip()

    # Strip markdown fences if Gemini wraps them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    tasks = json.loads(raw)

    # Validate structure
    validated = []
    for t in tasks:
        if "title" in t and "description" in t and "due_date" in t and "priority" in t:
            validated.append(t)

    return validated
