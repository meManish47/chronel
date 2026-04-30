from google import genai
import os
from dotenv import load_dotenv

from db.pinecone_client import index

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY", "")

if _api_key:
    client = genai.Client(api_key=_api_key)
else:
    client = None


def query_note(note_id: int, question: str) -> dict:
    """Search Pinecone for relevant chunks, then ask Gemini to answer."""

    if not client:
        return {
            "answer": "GEMINI_API_KEY is not configured.",
            "sources": [],
        }

    # ── 1. Vector search in Pinecone ─────────────────────────────────
    chunks = []
    try:
        results = index.search(
            namespace="__default__",
            query={
                "inputs": {"text": question},
                "filter": {"note_id": {"$eq": note_id}},
                "top_k": 5,
            }
        )

        for hit in results.get("result", {}).get("hits", []):
            fields = hit.get("fields", {})
            text = fields.get("chunk_text") or fields.get("text", "")
            if text:
                chunks.append(text)

    except Exception as e:
        print(f"Pinecone search error: {e}")

    if not chunks:
        return {
            "answer": "No content found for this note.",
            "sources": [],
        }

    # ── 2. Build prompt ──────────────────────────────────────────────
    context = "\n\n---\n\n".join(chunks)

    prompt = f"""You are a helpful study assistant. Answer ONLY from the content.

Note Content:
{context}

Question: {question}
"""

    # ── 3. Gemini call ───────────────────────────────────────────────
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
        )

        answer_text = response.text

    except Exception as e:
        print(f"Gemini API error: {e}")
        return {
            "answer": "Error generating answer.",
            "sources": chunks[:3],
        }

    return {
        "answer": answer_text,
        "sources": chunks[:3],
    }