import os
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX", "chronel")

def clear_all_records():
    print("Connecting to Pinecone...")
    pc = Pinecone(api_key=api_key)
    index = pc.Index(index_name)
    
    print("Deleting all records in '__default__' namespace...")
    index.delete(delete_all=True, namespace="__default__")
    print("✅ All Pinecone records have been deleted successfully.")

if __name__ == "__main__":
    clear_all_records()
