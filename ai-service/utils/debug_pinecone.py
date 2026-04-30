import os
import sys
from dotenv import load_dotenv
import pprint

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()
from db.pinecone_client import pc, index_name, index

def debug_pinecone():
    print("=== DEBUGGING PINECONE INDEX ===")
    
    try:
        # 1. Get index description
        description = pc.describe_index(index_name)
        print("\n1. Index Configuration:")
        print(f"Name: {description.name}")
        print(f"Host: {description.host}")
        print(f"Dimension: {description.dimension}")
        print(f"Metric: {description.metric}")
        print(f"Status: {description.status}")
        
        # Check if it has an embedding model configured (Pinecone 5.x Integrated Inference)
        if hasattr(description, 'embed') and description.embed:
            print(f"Embedding Model: {description.embed.model}")
            print(f"Field Map: {description.embed.field_map}")
        else:
            print("Embedding Model: None (Standard Index)")

        # 2. Check index stats
        stats = index.describe_index_stats()
        print("\n2. Index Stats:")
        print(f"Total Vector Count: {stats.total_vector_count}")
        print(f"Namespaces: {stats.namespaces}")

        # 3. Simulate and Print the Record Object
        print("\n3. Simulating the exact object format we send to upsert_records:")
        sample_record = {
            "id": "123_0",
            "text": "This is a sample chunk extracted from the PDF.",
            "chunk_text": "This is a sample chunk extracted from the PDF.",
            "note_id": 123,
            "clerk_id": "user_2aX...",
            "chunk_id": 0,
        }
        print("Record Object:")
        pprint.pprint(sample_record, indent=2)

    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_pinecone()
