from groq import Groq
import os
import time
from dotenv import load_dotenv

from db.pinecone_client import index
from utils.langfuse_client import langfuse

load_dotenv()

_api_key = os.getenv("GROQ_API_KEY", "")

if _api_key:
    client = Groq(api_key=_api_key)
else:
    client = None

def query_note(note_id: int, question: str) -> dict:
    """Search Pinecone for relevant chunks, then ask Groq to answer."""

    if not client:
        return {
            "answer": "GROQ_API_KEY is not configured.",
            "sources": [],
        }

    import time

    chunks = []

    try:
        retrieval_start = time.time()

        retrieval_obs = langfuse.start_observation(
            name="pinecone_search",
            as_type="retriever",
            input={
                "question": question,
                "note_id": note_id,
            },
        )

        results = index.search(
            namespace="__default__",
            query={
                "inputs": {"text": question},
                "filter": {"note_id": {"$eq": note_id}},
                "top_k": 5,
            },
        )

        for hit in results.get("result", {}).get("hits", []):
            fields = hit.get("fields", {})
            text = fields.get("chunk_text") or fields.get("text", "")

            if text:
                chunks.append(text)

        retrieval_latency_ms = round(
            (time.time() - retrieval_start) * 1000,
            2,
        )

        retrieval_obs.update(
            output={
                "chunks_found": len(chunks),
            },
            metadata={
                "latency_ms": retrieval_latency_ms,
                "top_k": 5,
                "note_id": note_id,
            },
        )

        retrieval_obs.end()

    except Exception as e:
        try:
            retrieval_obs.update(
                level="ERROR",
                status_message=str(e),
            )
            retrieval_obs.end()
            langfuse.flush()
        except Exception:
            pass

        print(f"Pinecone search error: {e}")

        return {
            "answer": "Error searching documents.",
            "sources": [],
        }

    if not chunks:
        langfuse.flush()

        return {
            "answer": "No content found for this note.",
            "sources": [],
        }

    context = "\n\n---\n\n".join(chunks)

    prompt = f"""You are a professional AI assistant.

Answer ONLY using the provided note content.

Rules:
1. Be concise and accurate.
2. Do not invent information.
3. Use bullet points when helpful.
4. Highlight important concepts using **bold** text.

Note Content:
{context}

Question:
{question}
"""

    try:
        llm_start = time.time()

        generation_obs = langfuse.start_observation(
            name="groq_generation",
            as_type="generation",
            input={
                "question": question,
            },
            model="llama-3.3-70b-versatile",
        )

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0.3,
        )

        answer_text = response.choices[0].message.content

        llm_latency_ms = round(
            (time.time() - llm_start) * 1000,
            2,
        )

        generation_obs.update(
            output={
                "answer": answer_text,
            },
            metadata={
                "latency_ms": llm_latency_ms,
                "retrieved_chunks": len(chunks),
            },
        )

        generation_obs.end()

        langfuse.flush()

        return {
            "answer": answer_text,
            "sources": chunks[:3],
        }

    except Exception as e:
        try:
            generation_obs.update(
                level="ERROR",
                status_message=str(e),
            )
            generation_obs.end()
            langfuse.flush()
        except Exception:
            pass

        print(f"Groq API error: {e}")

        return {
            "answer": "Error generating answer.",
            "sources": chunks[:3],
        }