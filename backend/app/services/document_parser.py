from pathlib import Path
from io import BytesIO
import fitz
from docx import Document

class UnsupportedDocumentError(ValueError):
    pass

def extract_text(filename: str, content: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        with fitz.open(stream=content, filetype="pdf") as pdf:
            return "\\n".join(page.get_text("text") for page in pdf)
    if suffix == ".docx":
        doc = Document(BytesIO(content))
        chunks = [p.text for p in doc.paragraphs if p.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                chunks.append(" | ".join(cell.text.strip() for cell in row.cells))
        return "\\n".join(chunks)
    raise UnsupportedDocumentError("Only PDF and DOCX files are supported.")
