from sentence_transformers import CrossEncoder

# Load reranker model
print("Loading model...")
reranker = CrossEncoder("BAAI/bge-reranker-base")

query = "How does RAG help businesses?"

chunks = [
    "Agentic RAG improves customer support...",
    "RAGBench evaluates RAG systems...",
    "Finance industry uses RAG for risk analysis...",
    "Some unrelated content about cooking pasta...",
    "Automating contract review processes, which includes identifying risks...",
]

print("Model loaded. Reranking chunks...")
# Create query-chunk pairs
pairs = [[query, chunk] for chunk in chunks]

# Get relevance scores
scores = reranker.predict(pairs)

# Combine chunks with scores
ranked_chunks = list(zip(chunks, scores))

# Sort by score descending
ranked_chunks.sort(key=lambda x: x[1], reverse=True)

# Take best 3
top_chunks = ranked_chunks[:3]

# Print results
print("\n--- Top Results ---")
for chunk, score in top_chunks:
    print(f"Score: {score:.4f}")
    print(chunk)
    print("-" * 50)
