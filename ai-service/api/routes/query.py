from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.rag_service import query_note

router = APIRouter()


class QueryRequest(BaseModel):
    note_id: int
    question: str


@router.post("/")
async def query_note_endpoint(data: QueryRequest):
    try:
        result = query_note(data.note_id, data.question)
        return result
    except Exception as e:
        import traceback
        with open("error.log", "w") as f:
            traceback.print_exc(file=f)
        raise HTTPException(status_code=500, detail=str(e))
