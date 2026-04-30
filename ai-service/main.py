from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import pdf, query, tasks_gen, music

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf.router,       prefix="/api/pdf")
app.include_router(query.router,     prefix="/api/query")
app.include_router(tasks_gen.router, prefix="/api/tasks")
app.include_router(music.router)      # /generate-music (no prefix — matches frontend call)


@app.get("/")
async def read_root():
    return {"status": "Chronel AI service running 🚀"}
