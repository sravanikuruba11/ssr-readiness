# SSR Readiness Score

A starter implementation of the internship specification: upload SSR PDF/DOCX files, extract text, detect common SSR sections and criteria, run deterministic completeness/evidence/consistency checks, calculate transparent readiness scores, and export a PDF report.

## Stack
- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- Backend: Python + FastAPI
- Document parsing: PyMuPDF + python-docx
- Report: ReportLab
- Optional AI: provider abstraction stub (disabled by default)
- Local development: Docker Compose (API + Redis + PostgreSQL placeholders)

> This is an internship/MVP implementation, not an official NAAC accreditation evaluator. The criterion rules and scoring weights are illustrative defaults. Review and customize them against the applicable accreditation framework before institutional use.

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
Open http://localhost:3000. The frontend expects the API at `http://localhost:8000`.

### Docker
```bash
docker compose up --build
```

## Supported inputs
- PDF (`.pdf`) via PyMuPDF
- DOCX (`.docx`) via python-docx
- Maximum upload size: 20 MB
- Scanned PDFs may produce little/no text. OCR is not included; add an OCR service for scanned documents.

## Scoring model
Each detected criterion is scored from 0–100 using deterministic checks:
- 40 points: criterion/section content is present
- 25 points: evidence/reference indicators are present
- 20 points: minimum text coverage is met
- 15 points: supporting numeric/table-like information is present

Overall readiness is the mean of detected criterion scores. If no criteria are detected, the overall score is 0 and the report flags the document for manual review. These are configurable heuristic rules, not official accreditation weights.

## Privacy and security notes
- Files are processed in memory and are not persisted by the API.
- The API does not log extracted source text.
- Configure TLS, authentication, encrypted object storage, retention/deletion, rate limits, malware scanning, and access controls before deployment.
- Lead capture is a consent-based demo endpoint. Connect a proper database and implement unsubscribe/preferences before production.
- Do not upload confidential student/staff records to an unapproved environment.

## API
- `GET /health`
- `POST /api/v1/analyze` — multipart upload, returns structured JSON
- `POST /api/v1/report` — JSON analysis result, returns downloadable PDF
- `POST /api/v1/leads` — demo lead capture (in-memory only)

## Tests
```bash
cd backend
pytest
```
