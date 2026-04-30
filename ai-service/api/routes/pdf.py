# pdf.py
from fastapi import APIRouter, HTTPException
from services.pdf_service import (
    PDFRequest,
    download_pdf,
    extract_text_from_pdf_bytes,
    is_scanned_pdf,

)
from db.pinecone_client import pc
from services.chunking_service import chunk_text
from services.embedding_service import store_chunks
router = APIRouter()


# ─── Main API ──────────────────────────────────────────────────────
@router.post("/process")
async def process_pdf(data: PDFRequest):
    try:
        # 1. Download from S3 (presigned URL)
        pdf_bytes = download_pdf(data.file_url)

        # 2. Extract text
        extracted_text = extract_text_from_pdf_bytes(pdf_bytes)

        # 3. Detect scanned PDFs
        if is_scanned_pdf(extracted_text):
            return {
                "status": "error",
                "message": "Scanned PDF detected - OCR required",
                "note_id": data.note_id
            }

        chunks = chunk_text(extracted_text)
        print('SUCCESSFULLY PROCESSED PDF, CHUNK COUNT:', len(chunks))

        # 4. Store in Pinecone (vector search) + PostgreSQL (full retrieval)
        stored = store_chunks(chunks, data.note_id, data.clerk_id)
        print(f'STORED {stored} CHUNKS to Pinecone + PostgreSQL')

        return {
            "status": "success",
            "note_id": data.note_id,
            "text_length": len(extracted_text),
            "chunks_stored": stored,
        }

    except Exception as e:
        import traceback
        with open("error.log", "w") as f:
            traceback.print_exc(file=f)
        raise HTTPException(status_code=500, detail=str(e))