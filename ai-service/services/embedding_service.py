from db.pinecone_client import index
from db.postgres_client import get_connection


def store_chunks(chunks: list[str], note_id: int, clerk_id: str):
    """Store chunks in both Pinecone (vector search) and PostgreSQL (full retrieval)."""
    if not chunks:
        raise ValueError("No chunks to store")

    chunks = [c.strip() for c in chunks if c and c.strip()]
    if not chunks:
        raise ValueError("All chunks empty after cleaning")

    # ── 1. Upsert to Pinecone for RAG vector search ──────────────────
    records = []
    for i, chunk in enumerate(chunks):
        records.append({
            "id": f"{note_id}_{i}",
            "text": chunk,         # Pinecone inference expects this
            "chunk_text": chunk,   # keep for backward compatibility
            "note_id": note_id,
            "clerk_id": clerk_id,
            "chunk_id": i,
        })
    # Pinecone inference max batch size is 96
    batch_size = 96
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        index.upsert_records(namespace="__default__", records=batch)

    # ── 2. Persist to PostgreSQL notes_chunks for task generation ─────
    conn = get_connection()
    try:
        cur = conn.cursor()
        # Clear old chunks for this note (re-upload scenario)
        cur.execute("DELETE FROM notes_chunks WHERE note_id = %s", (note_id,))
        for i, chunk in enumerate(chunks):
            token_count = len(chunk.split())
            cur.execute(
                """INSERT INTO notes_chunks (note_id, content, chunk_index, token_count)
                   VALUES (%s, %s, %s, %s)""",
                (note_id, chunk, i, token_count),
            )
        conn.commit()
    finally:
        conn.close()

    return len(chunks)
