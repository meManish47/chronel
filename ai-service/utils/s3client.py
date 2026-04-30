from dotenv import load_dotenv
import os
import boto3

load_dotenv()

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("VITE_AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("VITE_AWS_SECRET"),
    region_name=os.getenv("AWS_REGION"),
)
response = s3_client.list_buckets()
buckets =response["Buckets"]
print(buckets[0]["Name"])