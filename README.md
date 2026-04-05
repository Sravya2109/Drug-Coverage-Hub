# Drug Coverage Hub — Medical Policy Extraction System

A Python pipeline that converts medical policy PDFs into a unified, structured JSON schema. Handles medical policies, formularies, and clinical guidelines — all normalized to the same output format.

## What It Does

```
Unstructured PDFs → normalized coverage intelligence
```

Given a PDF like a payer's prior authorization policy or drug formulary, the system extracts:
- Every drug mentioned, with codes (HCPCS, NDC)
- Coverage rules per drug per indication
- Prior authorization requirements and step therapy criteria
- ICD-10 diagnosis codes
- Document metadata (payer, policy ID, effective date)

All output conforms to a single JSON schema, regardless of the source document type.

## Core Data Model

```
(payer + plan + drug + indication?) → coverage_rule
```

## Pipeline

```
PDF → Text → Sections → Extract (LLM) → Normalize → Enrich → Validate → JSON
```

| Stage | Tool | Description |
|---|---|---|
| PDF Parsing | pdfplumber / PyMuPDF | Text + table extraction with page traceability |
| Section Detection | Regex | Split into coverage, indications, ICD-10, etc. |
| Metadata Extraction | Regex + Claude fallback | Payer, policy ID, dates |
| Content Extraction | Claude API | Drugs, rules, criteria — no normalization |
| Normalization | Python | Coverage status enums, code validation |
| Enrichment | Python | Biosimilar detection, ICD ranges, step therapy parsing |
| Validation | Python | Schema and business rule checks |
| Output | JSON | Unified schema to disk or API response |

---

## Project Structure

```
drug-coverage-hub/
├── policy_extractor/
│   ├── config.py                  # All configuration (env-based)
│   ├── main.py                    # CLI entrypoint
│   ├── data/
│   │   ├── biosimilar_map.json    # Biosimilar → reference product mappings
│   │   └── payer_aliases.json     # Payer name normalization
│   ├── prompts/
│   │   └── extract_prompt.txt     # LLM extraction prompt
│   ├── services/
│   │   ├── pdf_parser.py          # PDF → ParsedDocument
│   │   ├── section_splitter.py    # Text → SectionMap
│   │   ├── metadata_extractor.py  # Header → Metadata
│   │   ├── extractor.py           # Sections → RawExtraction (LLM)
│   │   ├── normalizer.py          # Raw → NormalizedExtraction
│   │   ├── enricher.py            # Normalized → EnrichedExtraction
│   │   └── validator.py           # Validation checks
│   ├── utils/
│   │   ├── text_utils.py          # String helpers, date normalization, chunking
│   │   └── icd_utils.py           # ICD-10 validation and range expansion
│   ├── api/
│   │   ├── app.py                 # FastAPI application
│   │   ├── routes/extraction.py   # API endpoints
│   │   └── schemas/extraction.py  # Pydantic request/response models
│   └── output/                    # Default output directory
├── requirements.txt
└── plan.md
```

---

## Setup

**Requirements:** Python 3.11+

```bash
# Clone and enter the project
git clone <repo-url>
cd drug-coverage-hub

# Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file from the example and add your API key
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=your_key_here
```

---

## Usage

### CLI

Process a single PDF:

```bash
python -m policy_extractor.main --input path/to/policy.pdf --output output/result.json
```

Process a directory of PDFs (one output file per PDF):

```bash
python -m policy_extractor.main --input path/to/pdfs/
```

Dry run (run full pipeline, skip writing output):

```bash
python -m policy_extractor.main --input path/to/policy.pdf --dry-run
```

### API Server

```bash
uvicorn policy_extractor.api.app:app --reload
```

The API will be available at `http://localhost:8000`.

#### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check, returns model name |
| `POST` | `/api/v1/extract` | Upload a PDF, get full extraction |
| `POST` | `/api/v1/extract/path` | Extract from a server-side file path |
| `POST` | `/api/v1/extract/validate-only` | Run pipeline, return validation result only |

**Upload and extract:**

```bash
curl -X POST http://localhost:8000/api/v1/extract \
  -F "file=@path/to/policy.pdf"
```

**Extract by server-side path:**

```bash
curl -X POST http://localhost:8000/api/v1/extract/path \
  -H "Content-Type: application/json" \
  -d '{"file_path": "/absolute/path/to/policy.pdf"}'
```

**Validate only (no output written):**

```bash
curl -X POST http://localhost:8000/api/v1/extract/validate-only \
  -F "file=@path/to/policy.pdf"
```

---

## Output Schema

```json
{
  "metadata": {
    "payer_name": "UnitedHealthcare",
    "plan_name": null,
    "policy_id": "MP-0123",
    "policy_type": "medical_policy",
    "source_file": "path/to/policy.pdf",
    "effective_date": "2025-01-01",
    "reviewed_date": "2024-11-15"
  },
  "drugs": [
    {
      "drug_name": "Adalimumab",
      "generic_name": null,
      "hcpcs_codes": ["J0135"],
      "ndc_codes": [],
      "biosimilar_of": null
    }
  ],
  "coverage_rules": [
    {
      "drug_name": "Adalimumab",
      "indication_name": "Rheumatoid Arthritis",
      "coverage_status": "covered",
      "pa_required": true,
      "step_therapy": ["Must have tried methotrexate for at least 3 months"],
      "criteria": [
        "Diagnosis of moderate-to-severe rheumatoid arthritis",
        "Inadequate response to conventional DMARDs"
      ],
      "coverage_tier": null,
      "approval_duration_days": 365,
      "quantity_limits": [],
      "notes": null
    }
  ],
  "icd10_codes": ["M05.79", "M06.09"],
  "program_exceptions": [],
  "extraction_notes": []
}
```

### `coverage_status` values

| Value | Meaning |
|---|---|
| `covered` | Medically necessary / proven |
| `not_covered` | Not medically necessary / excluded |
| `requires_pa` | Covered with prior authorization |
| `restricted` | Non-preferred, step therapy required, or tier-restricted |
| `investigational` | Experimental or unproven |

---

## Configuration

Settings are loaded from a `.env` file in the project root (see `.env.example`). All values can also be set as environment variables directly.

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | *(required)* | Your Anthropic API key |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` | Claude model to use for extraction |
| `MAX_TOKENS_PER_CHUNK` | `8000` | Max tokens per LLM call (sections are chunked if larger) |
| `LLM_RETRY_ATTEMPTS` | `3` | Number of retries on LLM failure |
| `LLM_RETRY_BACKOFF_SECONDS` | `2` | Base backoff between retries |
| `TEMPERATURE` | `0` | LLM temperature (0 = deterministic) |
| `OUTPUT_DIR` | `policy_extractor/output` | Default output directory |

---

## Design Decisions

**Single schema for all document types.** Medical policies, formularies, and clinical guidelines all normalize into the same `coverage_rules[]` structure. Formularies set `indication_name: null`.

**LLM only for extraction.** Claude is used only to extract raw content from text — no normalization or inference. All mapping, validation, and enrichment is deterministic Python code. This reduces hallucination risk and makes failures debuggable.

**Criteria stored as plain text.** Coverage criteria are kept as verbatim strings rather than being forced into premature structure. This preserves clinical nuance and improves extraction reliability.

**Graceful degradation.** If a section fails to extract, the pipeline continues with whatever it has. If the output fails validation, it is still written with `"validation_failed": true` and `"validation_errors"` populated.

---

## Supported Document Types

| Type | Example Content | Notes |
|---|---|---|
| Medical Policy | PA criteria, step therapy, coverage determinations | Full indication + criteria extraction |
| Formulary | Drug tier lists, quantity limits | `indication_name` set to `null` |
| Clinical Guideline | Evidence-based coverage recommendations | Criteria extracted as free text |

---

## Limitations

- **Scanned PDFs** (image-only) are not supported. The parser will detect this case and add a note to `extraction_notes` rather than producing empty output silently.
- **Non-English documents** are not tested and may produce degraded results.
- **Handwritten or heavily formatted PDFs** may require PyMuPDF fallback and could have reduced accuracy.

---

## Success Criteria

- ≥ 90% extraction accuracy on the evaluation set
- Consistent schema output across all document types
- No fabricated drugs, indications, or coverage statuses
- Validation errors are explicit and actionable
