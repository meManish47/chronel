from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter()

# ── Curated royalty-free tracks mapped to stress level ───────────────────────
# Source: Bensound.com (free for non-commercial / attribution use)
TRACKS = {
    "low": [
        "https://www.bensound.com/bensound-music/bensound-relaxing.mp3",
        "https://www.bensound.com/bensound-music/bensound-slowmotion.mp3",
        "https://www.bensound.com/bensound-music/bensound-dreams.mp3",
    ],
    "medium": [
        "https://www.bensound.com/bensound-music/bensound-creativeminds.mp3",
        "https://www.bensound.com/bensound-music/bensound-ukulele.mp3",
        "https://www.bensound.com/bensound-music/bensound-sunny.mp3",
    ],
    "high": [
        "https://www.bensound.com/bensound-music/bensound-epic.mp3",
        "https://www.bensound.com/bensound-music/bensound-energy.mp3",
        "https://www.bensound.com/bensound-music/bensound-action.mp3",
    ],
}

GENRE_LABELS = {
    "low": "ambient / calm",
    "medium": "lo-fi / focus",
    "high": "classical / epic",
}


class TaskSummary(BaseModel):
    total_tasks: int
    overdue_tasks: int
    due_soon: int
    high_priority: int


def compute_stress(summary: TaskSummary) -> str:
    score = summary.overdue_tasks * 3 + summary.due_soon * 2 + summary.high_priority * 1
    if score < 4:
        return "low"
    if score < 8:
        return "medium"
    return "high"


@router.post("/generate-music")
async def generate_music(summary: TaskSummary):
    stress = compute_stress(summary)
    track_url = random.choice(TRACKS[stress])
    return {
        "music_url": track_url,
        "stress": stress,
        "genre": GENRE_LABELS[stress],
    }
