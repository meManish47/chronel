from groq import Groq
import os
from dotenv import load_dotenv

from db.pinecone_client import index

load_dotenv()

_api_key = os.getenv("GROQ_API_KEY", "")

if _api_key:
    client = Groq(api_key=_api_key)
else:
    client = None


def query_note(note_id: int, question: str) -> dict:
    """Search Pinecone for relevant chunks, then ask Gemini to answer."""

    if not client:
        return {
            "answer": "GROQ_API_KEY is not configured.",
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

    prompt = f"""You are a professional AI assistant. Your goal is to answer based ONLY on the provided content.

Follow these rules strictly:
1. Answer naturally and concisely.
2. Avoid generic headings.
3. Synthesize information instead of listing retrieved text.
4. Use professional but human-readable language.
5. Use **bold text** to highlight key terms and concepts.
6. Break down complex information using clear bullet points if applicable.

Note Content:
{context}

Question: {question}
"""

    # ── 3. Groq call ───────────────────────────────────────────────
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
        )

        answer_text = response.choices[0].message.content

    except Exception as e:
        print(f"Groq API error: {e}")
        return {
            "answer": "Error generating answer.",
            "sources": chunks[:3],
        }

    return {
        "answer": answer_text,
        "sources": chunks[:3],
    }