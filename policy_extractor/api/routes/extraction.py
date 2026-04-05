from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from policy_extractor.api.schemas.extraction import (
    ExtractionResponse,
    HealthResponse,
    ValidationResultSchema,
)
from policy_extractor.config import get_config

router = APIRouter()


class FilePathRequest(BaseModel):
    file_path: str
    dry_run: bool = False


def _run_and_build_response(pdf_path: str) -> dict:
    from policy_extractor.main import _run_pipeline
    from policy_extractor.services.mongo_writer import upsert_policy

    output, _valid = _run_pipeline(pdf_path)

    try:
        doc_id = upsert_policy(output)
        output["_mongo_id"] = doc_id
    except Exception as e:
        output["_mongo_error"] = str(e)

    return output


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    config = get_config()
    return HealthResponse(status="ok", model=config.claude_model)


@router.post("/extract", response_model=ExtractionResponse)
async def extract_file(file: UploadFile = File(...)) -> ExtractionResponse:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        output = _run_and_build_response(tmp_path)
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return ExtractionResponse(**output)


@router.post("/extract/path", response_model=ExtractionResponse)
def extract_by_path(request: FilePathRequest) -> ExtractionResponse:
    if not Path(request.file_path).exists():
        raise HTTPException(status_code=404, detail=f"File not found: {request.file_path}")
    output = _run_and_build_response(request.file_path)
    return ExtractionResponse(**output)


@router.post("/extract/validate-only", response_model=ValidationResultSchema)
async def validate_only(file: UploadFile = File(...)) -> ValidationResultSchema:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        from policy_extractor.services.pdf_parser import parse_pdf
        from policy_extractor.services.section_splitter import split_sections
        from policy_extractor.services.metadata_extractor import extract_metadata
        from policy_extractor.services.extractor import extract_from_sections
        from policy_extractor.services.normalizer import normalize
        from policy_extractor.services.enricher import enrich
        from policy_extractor.services.validator import validate

        doc = parse_pdf(tmp_path)
        section_map = split_sections(doc.full_text)
        metadata = extract_metadata(section_map.get("header", ""), doc.full_text, tmp_path)
        raw = extract_from_sections(section_map, metadata.payer_name or "")
        normalized = normalize(raw)
        enriched = enrich(normalized)
        result = validate(enriched, source_was_nonempty=bool(doc.full_text.strip()))
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return ValidationResultSchema(valid=result.valid, errors=result.errors, warnings=result.warnings)
