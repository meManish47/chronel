from pinecone import Pinecone
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX", "chronel")

pc = Pinecone(api_key=api_key)

# 🔥 Create index if not exists
existing_indexes = pc.list_indexes().names()

if index_name not in existing_indexes:
    print("Creating Pinecone index...")

    pc.create_index_for_model(  
        name=index_name,
        cloud="aws",
        region="us-east-1",
        embed={
            "model": "llama-text-embed-v2",
            "field_map": {
                "text": "chunk_text"
            }
        }
    )

# connect
index = pc.Index(index_name)