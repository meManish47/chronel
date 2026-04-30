from dotenv import load_dotenv
import os
from supabase import create_client, Client
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
# print("URL OF SUPABSE",url)
supabase: Client = create_client(url,key)

response = supabase.table("users").select("*").execute()

# print(response)   