from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.task_gen_service import generate_tasks_from_note

router = APIRouter()


class TaskGenRequest(BaseModel):
    note_id: int


@router.post("/generate")
async def generate_tasks(data: TaskGenRequest):
    try:
        tasks = generate_tasks_from_note(data.note_id)
        return {"tasks": tasks, "count": len(tasks)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
