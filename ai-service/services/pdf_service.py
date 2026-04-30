from pydantic import BaseModel
import requests
import io
import re

from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams

# ─── Request Schema ────────────────────────────────────────────────
class PDFRequest(BaseModel):
    file_url: str
    note_id: int
    clerk_id: str


# ─── Text Cleaning ─────────────────────────────────────────────────
def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)   # collapse spaces
    text = re.sub(r"\n+", " ", text)   # remove newlines
    return text.strip()


# ─── PDF Extraction (Advanced pdfminer) ────────────────────────────
def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    output = io.StringIO()
    laparams = LAParams()

    extract_text_to_fp(
        io.BytesIO(pdf_bytes),
        output,
        laparams=laparams
    )

    text = output.getvalue()
    return clean_text(text)


# ─── Scanned PDF Detection ─────────────────────────────────────────
def is_scanned_pdf(text: str) -> bool:
    return len(text.strip()) < 50


# ─── Download PDF (Safe) ───────────────────────────────────────────
def download_pdf(url: str) -> bytes:
    try:
        response = requests.get(url, timeout=10)  # ⏱ timeout added
        response.raise_for_status()
        return response.content
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

