import os
from dotenv import load_dotenv
import traceback

load_dotenv()
from db.pinecone_client import index
from services.embedding_service import store_chunks

try:
    print("Testing store_chunks...")
    store_chunks(["test chunk"], 9999, "user_123")
    print("Success!")
except Exception as e:
    traceback.print_exc()
