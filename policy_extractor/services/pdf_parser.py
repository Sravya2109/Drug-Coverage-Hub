from __future__ import annotations

import io
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class PageContent:
    page_number: int
    text: str


@dataclass
class ParsedDocument:
    pages: list[PageContent]
    full_text: str
    parser_used: str
    warnings: list[str] = field(default_factory=list)


def _tables_to_text(tables: list) -> str:
    lines = []
    for table in tables:
        if not table:
            continue
        lines.append("[TABLE START]")
        for row in table:
            if row:
                cells = [str(c).strip() if c is not None else "" for c in row]
                lines.append(" | ".join(cells))
        lines.append("[TABLE END]")
    return "\n".join(lines)


def _parse_with_pdfplumber(file_path: str) -> tuple[list[PageContent], list[str]]:
    import pdfplumber

    pages: list[PageContent] = []
    warnings: list[str] = []

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text(x_tolerance=3, y_tolerance=3) or ""
            tables = page.extract_tables() or []
            table_text = _tables_to_text(tables)
            combined = text + ("\n" + table_text if table_text else "")
            pages.append(PageContent(page_number=page.page_number, text=combined.strip()))

    return pages, warnings


def _parse_page_with_pymupdf(file_path: str, page_index: int) -> str:
    import fitz  # PyMuPDF

    doc = fitz.open(file_path)
    page = doc[page_index]
    text = page.get_text("text")
    doc.close()
    return text or ""


def parse_pdf(file_path: str) -> ParsedDocument:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {file_path}")

    warnings: list[str] = []
    pages: list[PageContent] = []
    parser_used = "pdfplumber"

    try:
        raw_pages, parse_warnings = _parse_with_pdfplumber(file_path)
        warnings.extend(parse_warnings)

        for i, page in enumerate(raw_pages):
            if len(page.text.strip()) < 100:
                # Fallback to PyMuPDF for this page
                try:
                    fallback_text = _parse_page_with_pymupdf(file_path, i)
                    if len(fallback_text.strip()) >= len(page.text.strip()):
                        pages.append(PageContent(page_number=page.page_number, text=fallback_text.strip()))
                        parser_used = "pymupdf (partial)"
                        warnings.append(
                            f"Page {page.page_number}: switched to PyMuPDF fallback (pdfplumber returned < 100 chars)"
                        )
                        continue
                except Exception as e:
                    warnings.append(f"Page {page.page_number}: PyMuPDF fallback failed: {e}")
            pages.append(page)

    except Exception as e:
        warnings.append(f"pdfplumber failed: {e}. Retrying with PyMuPDF.")
        parser_used = "pymupdf"
        try:
            import fitz

            doc = fitz.open(file_path)
            for i, page in enumerate(doc):
                text = page.get_text("text") or ""
                pages.append(PageContent(page_number=i + 1, text=text.strip()))
            doc.close()
        except Exception as e2:
            raise RuntimeError(f"Both parsers failed for {file_path}: pdfplumber={e}, pymupdf={e2}") from e2

    full_text = "\n\n".join(p.text for p in pages)

    if not full_text.strip():
        warnings.append("source_pdf_appears_to_be_scanned_image")

    return ParsedDocument(pages=pages, full_text=full_text, parser_used=parser_used, warnings=warnings)
