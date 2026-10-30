import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from io import BytesIO
from pydantic import BaseModel, EmailStr
from app.services.document_parser import extract_text, UnsupportedDocumentError
from app.services.analyzer import analyze_text
from app.services.report import build_pdf

app = FastAPI(title="SSR Readiness Score API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
MAX_BYTES = int(os.getenv("MAX_UPLOAD_MB", "20")) * 1024 * 1024

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/v1/analyze")
async def analyze(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    if not filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(415, "Upload a PDF or DOCX file.")
    content = await file.read()
    if not content:
        raise HTTPException(400, "The uploaded file is empty.")
    if len(content) > MAX_BYTES:
        raise HTTPException(413, f"File exceeds the {MAX_BYTES // (1024*1024)} MB limit.")
    try:
        text = extract_text(filename, content)
    except UnsupportedDocumentError as exc:
        raise HTTPException(415, str(exc))
    except Exception:
        raise HTTPException(400, "Could not read this document. Check that it is a valid PDF or DOCX.")
    if not text.strip():
        raise HTTPException(422, "No readable text found. This may be a scanned PDF; OCR is not enabled.")
    return analyze_text(text, filename).model_dump()

class ReportRequest(BaseModel):
    result: dict

@app.post("/api/v1/report")
def report(request: ReportRequest):
    pdf = build_pdf(request.result)
    return StreamingResponse(BytesIO(pdf), media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="ssr-readiness-report.pdf"'})

class Lead(BaseModel):
    name: str
    official_email: EmailStr
    institution: str
    designation: str
    consent: bool

_leads = []
@app.post("/api/v1/leads")
def create_lead(lead: Lead):
    if not lead.consent:
        raise HTTPException(400, "Consent is required to submit this form.")
    # Demo only: replace with persistent database storage and retention controls.
    _leads.append(lead.model_dump())
    return {"status": "received"}
