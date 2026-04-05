# Medical Policy Extraction System Development Plan

## Goal

Build a Python pipeline that converts medical policy PDFs into one unified JSON schema, regardless of document type:

- medical policy
- formulary
- clinical guideline

The system should produce consistent, validation-ready coverage data that downstream services can store, query, and compare.

## Core Principle

Every document should normalize to the same conceptual model:

```text
(payer + plan + drug + indication?) -> coverage rule
```

Notes:

- `plan` is optional because some source documents are payer-level only.
- `indication` is optional because formularies may not include diagnosis-specific rules.
- every extracted statement should become a coverage rule or supporting metadata

## Final Unified JSON Schema

```json
{
  "metadata": {
    "payer_name": "",
    "plan_name": null,
    "policy_id": "",
    "policy_type": "",
    "source_file": "",
    "effective_date": "",
    "reviewed_date": ""
  },
  "drugs": [
    {
      "drug_name": "",
      "generic_name": null,
      "hcpcs_codes": [],
      "ndc_codes": [],
      "biosimilar_of": null
    }
  ],
  "coverage_rules": [
    {
      "drug_name": "",
      "indication_name": null,
      "coverage_status": "covered",
      "pa_required": null,
      "step_therapy": [],
      "criteria": [],
      "coverage_tier": null,
      "approval_duration_days": null,
      "quantity_limits": [],
      "notes": null
    }
  ],
  "icd10_codes": [],
  "program_exceptions": [],
  "extraction_notes": []
}
```

## Pipeline Overview

```text
PDF -> Text -> Sections -> Extract -> Normalize -> Enrich -> Validate -> JSON
```

## Implementation Plan

### 1. PDF Parsing

Extract raw text from source PDFs with layout awareness.

Tools:

- `pdfplumber` as the primary parser
- `PyMuPDF` as a fallback for difficult files

Output:

```text
full_text
```

Implementation notes:

- preserve page boundaries for traceability
- capture table-like content when possible
- store parser warnings in `extraction_notes`

### 2. Section Detection

Split the raw text into logical sections using rule-based header detection.

Candidate section labels:

- `POSITION STATEMENT`
- `INDICATIONS`
- `COVERAGE`
- `PRIOR AUTHORIZATION`
- `BILLING AND CODING`
- `ICD-10`
- `LIMITATIONS`
- `EXCLUSIONS`

Output:

```json
{
  "header": "...",
  "coverage": "...",
  "coding": "...",
  "notes": "..."
}
```

Implementation notes:

- use regex and uppercase-header heuristics first
- keep original section text for debugging
- allow missing sections without failing the pipeline

### 3. Metadata Extraction

Extract document-level metadata using regex first and lightweight LLM fallback only when required.

Fields:

- `payer_name`
- `plan_name`
- `policy_id`
- `policy_type`
- `effective_date`
- `reviewed_date`
- `source_file`

Implementation notes:

- prefer deterministic extraction
- record fallback usage in `extraction_notes`
- normalize dates to ISO format where possible

### 4. Raw Content Extraction

Use the LLM only for high-recall extraction from the detected sections.

Extract only:

- drugs
- indications
- criteria text
- coverage statements
- HCPCS, NDC, and ICD-10 codes

Rules:

- no normalization
- no inference
- no schema shaping beyond the requested extraction format

### 5. Normalization

Transform raw extracted values into standardized internal values.

Normalize:

- drug names to canonical casing and whitespace
- indication names using a controlled dictionary
- coverage status to a fixed enum
- code formats for HCPCS, NDC, and ICD-10

Coverage status mapping examples:

- `proven` -> `covered`
- `medically necessary` -> `covered`
- `not medically necessary` -> `not_covered`
- `preferred specialty` -> `restricted`

### 6. Coverage Rule Construction

Convert extracted content into `coverage_rules[]`.

Rule construction standards:

- one rule per `(drug_name, indication_name)` pair
- set `indication_name` to `null` when not present
- split multiple independent indications into separate rules
- preserve complex clinical requirements as plain-text `criteria`

### 7. Enrichment

Apply deterministic enrichment after normalization.

Examples:

- expand ICD ranges when feasible
- map biosimilars to their reference products
- detect step-therapy patterns such as "must try X before Y"
- extract approval durations and quantity limits from free text

This step must remain code-based rather than model-based.

### 8. Validation

Run structural and business-rule validation before output.

Checks:

- missing `drug_name`
- invalid `coverage_status`
- duplicate coverage rules
- empty output for a non-empty document
- malformed codes

Validation output:

```json
{
  "valid": true,
  "errors": []
}
```

### 9. Final JSON Output

Combine:

- metadata
- drugs
- coverage rules
- codes
- notes

Save output to:

```text
output/result.json
```

## Project Structure

```text
policy_extractor/
├── api/
│   ├── app.py
│   ├── routes/
│   │   └── extraction.py
│   └── schemas/
│       └── extraction.py
├── main.py
├── config.py
├── services/
│   ├── pdf_parser.py
│   ├── section_splitter.py
│   ├── metadata_extractor.py
│   ├── extractor.py
│   ├── normalizer.py
│   ├── enricher.py
│   └── validator.py
├── utils/
│   ├── text_utils.py
│   └── icd_utils.py
├── prompts/
│   └── extract_prompt.txt
└── output/
    └── result.json
```

API serving notes:

- `main.py` is the CLI or batch entrypoint for local processing
- `api/app.py` serves the REST API using FastAPI
- `api/routes/extraction.py` exposes endpoints such as `/extract` and `/health`
- `api/schemas/extraction.py` defines request and response models

## Design Decisions

### 1. Single Output Schema

Do not create separate output formats for policies, formularies, and guidelines. Everything should map into `coverage_rules`.

### 2. Optional Indication

Use `null` when a document expresses drug coverage without diagnosis-specific context.

### 3. Criteria Stored as Text

Keep criteria as plain text instead of forcing premature structure. This improves extraction reliability and preserves nuance.

### 4. Code Over LLM for Logic

Use deterministic code for:

- normalization
- mapping
- enrichment
- validation

### 5. LLM Only for Extraction

Limit the model to extracting content from text. This reduces hallucination risk and makes failures easier to debug.

## Performance Considerations

- chunk long documents by section before extraction
- run independent extraction tasks in parallel when possible
- retry transient LLM failures with bounded backoff
- cache LLM responses for repeated documents or prompts

## Testing Strategy

- create fixture PDFs for each document type
- add golden JSON outputs for regression testing
- test normalization and validation with unit tests
- measure extraction accuracy on a labeled sample set

## Future Enhancements

- PostgreSQL storage with JSONB
- Redis-backed response caching
- document version comparison
- UI for cross-payer coverage comparison

## Success Criteria

- at least 90 percent extraction accuracy on the evaluation set
- consistent schema output across document types
- no fabricated drugs, indications, or coverage states
- validation errors are explicit and actionable

## Final Outcome

```text
Unstructured PDFs -> normalized coverage intelligence
```
