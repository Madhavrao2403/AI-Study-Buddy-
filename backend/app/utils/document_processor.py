from typing import List, Optional, Tuple
import re


def extract_text_from_content(content: bytes, file_type: str, filename: str) -> str:
    """Extract text from various file types."""
    file_type = file_type.lower()

    if file_type in ["text/plain", "txt"] or filename.endswith(".txt"):
        return _extract_text(content)
    elif file_type in ["application/pdf", "pdf"] or filename.endswith(".pdf"):
        return _extract_pdf(content)
    elif file_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"] or filename.endswith(".docx"):
        return _extract_docx(content)
    else:
        # Try as text
        try:
            return content.decode("utf-8", errors="ignore")
        except Exception:
            return ""


def _extract_text(content: bytes) -> str:
    return content.decode("utf-8", errors="ignore")


def _extract_pdf(content: bytes) -> str:
    try:
        import PyPDF2
        import io
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        return "\n\n".join(text_parts)
    except Exception as e:
        return f"[PDF extraction failed: {e}]"


def _extract_docx(content: bytes) -> str:
    try:
        import docx
        import io
        doc = docx.Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as e:
        return f"[DOCX extraction failed: {e}]"


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks by words."""
    # Clean text
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {3,}', ' ', text)
    text = text.strip()

    if not text:
        return []

    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        if end >= len(words):
            break
        start = end - overlap  # overlap for context continuity

    return chunks
