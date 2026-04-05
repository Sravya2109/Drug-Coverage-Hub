from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def _run_pipeline(pdf_path: str) -> tuple[dict, bool]:
    from policy_extractor.services.pdf_parser import parse_pdf
    from policy_extractor.services.section_splitter import split_sections
    from policy_extractor.services.metadata_extractor import extract_metadata
    from policy_extractor.services.extractor import extract_from_sections
    from policy_extractor.services.normalizer import normalize
    from policy_extractor.services.enricher import enrich
    from policy_extractor.services.validator import validate

    doc = parse_pdf(pdf_path)
    section_map = split_sections(doc.full_text)

    header_text = section_map.get("header", "")
    metadata = extract_metadata(header_text, doc.full_text, pdf_path)

    raw = extract_from_sections(section_map, metadata.payer_name or "")
    normalized = normalize(raw)
    enriched = enrich(normalized)

    source_nonempty = bool(doc.full_text.strip())
    validation = validate(enriched, source_was_nonempty=source_nonempty)

    all_notes = (
        doc.warnings
        + metadata.extraction_notes
        + enriched.extraction_notes
    )

    output = {
        "metadata": {
            "payer_name": metadata.payer_name,
            "plan_name": metadata.plan_name,
            "policy_id": metadata.policy_id,
            "policy_type": metadata.policy_type,
            "source_file": metadata.source_file,
            "effective_date": metadata.effective_date,
            "reviewed_date": metadata.reviewed_date,
        },
        "drugs": [
            {
                "drug_name": d.drug_name,
                "generic_name": d.generic_name,
                "hcpcs_codes": d.hcpcs_codes,
                "ndc_codes": d.ndc_codes,
                "biosimilar_of": d.biosimilar_of,
            }
            for d in enriched.drugs
        ],
        "coverage_rules": [
            {
                "drug_name": r.drug_name,
                "indication_name": r.indication_name,
                "coverage_status": r.coverage_status,
                "pa_required": r.pa_required,
                "step_therapy": r.step_therapy,
                "criteria": r.criteria,
                "coverage_tier": r.coverage_tier,
                "approval_duration_days": r.approval_duration_days,
                "quantity_limits": r.quantity_limits,
                "notes": r.notes,
            }
            for r in enriched.coverage_rules
        ],
        "icd10_codes": enriched.icd10_codes,
        "program_exceptions": enriched.program_exceptions,
        "extraction_notes": all_notes,
    }

    if not validation.valid:
        output["validation_failed"] = True
        output["validation_errors"] = validation.errors

    if validation.warnings:
        output["validation_warnings"] = validation.warnings

    return output, validation.valid


def _process_file(pdf_path: str, output_path: str | None, dry_run: bool) -> bool:
    print(f"Processing: {pdf_path}")
    output, valid = _run_pipeline(pdf_path)

    n_drugs = len(output.get("drugs", []))
    n_rules = len(output.get("coverage_rules", []))
    status = "VALID" if valid else "VALIDATION FAILED"
    print(f"  Drugs: {n_drugs}  Rules: {n_rules}  Status: {status}")

    if output.get("validation_errors"):
        for err in output["validation_errors"]:
            print(f"  ERROR: {err}")

    if not dry_run:
        out = Path(output_path) if output_path else Path("output") / "result.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        with open(out, "w") as f:
            json.dump(output, f, indent=2, default=str)
        print(f"  Output written to: {out}")

        # Write to MongoDB
        try:
            from policy_extractor.services.mongo_writer import upsert_policy
            doc_id = upsert_policy(output)
            print(f"  MongoDB upserted: {doc_id}")
        except Exception as e:
            print(f"  MongoDB write failed: {e}")

    return valid


def main() -> None:
    parser = argparse.ArgumentParser(description="Medical Policy Extraction Pipeline")
    parser.add_argument("--input", required=True, help="Path to PDF file or directory of PDFs")
    parser.add_argument("--output", help="Path to write output JSON (default: output/result.json)")
    parser.add_argument("--dry-run", action="store_true", help="Run pipeline without writing output")
    args = parser.parse_args()

    input_path = Path(args.input)
    all_valid = True

    if input_path.is_dir():
        pdfs = list(input_path.glob("*.pdf"))
        if not pdfs:
            print(f"No PDF files found in {input_path}")
            sys.exit(1)
        for pdf in pdfs:
            output_path = args.output
            if not output_path and not args.dry_run:
                output_path = str(Path("output") / f"{pdf.stem}.json")
            valid = _process_file(str(pdf), output_path, args.dry_run)
            if not valid:
                all_valid = False
    elif input_path.is_file():
        valid = _process_file(str(input_path), args.output, args.dry_run)
        if not valid:
            all_valid = False
    else:
        print(f"Input path not found: {input_path}")
        sys.exit(1)

    sys.exit(0 if all_valid else 1)


if __name__ == "__main__":
    main()
