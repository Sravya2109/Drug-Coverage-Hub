from __future__ import annotations

import re
from dataclasses import dataclass, field

from policy_extractor.services.extractor import RawExtraction
from policy_extractor.utils.icd_utils import parse_icd10_code
from policy_extractor.utils.text_utils import normalize_drug_name

HCPCS_PATTERN = re.compile(r"^[A-Z]\d{4}$")
NDC_PATTERN = re.compile(r"^\d{10,11}$")

COVERAGE_STATUS_MAP: list[tuple[str, str]] = [
    ("not medically necessary", "not_covered"),
    ("not covered", "not_covered"),
    ("non-covered", "not_covered"),
    ("noncovered", "not_covered"),
    ("excluded", "not_covered"),
    ("experimental", "investigational"),
    ("investigational", "investigational"),
    ("unproven", "investigational"),
    ("not proven", "investigational"),
    ("requires prior authorization", "requires_pa"),
    ("prior authorization required", "requires_pa"),
    ("pa required", "requires_pa"),
    ("prior auth required", "requires_pa"),
    ("preferred specialty", "restricted"),
    ("non-preferred", "restricted"),
    ("nonpreferred", "restricted"),
    ("restricted", "restricted"),
    ("step therapy required", "restricted"),
    ("with restrictions", "restricted"),
    ("proven", "covered"),
    ("medically necessary", "covered"),
    ("medically indicated", "covered"),
    ("covered", "covered"),
    ("medically appropriate", "covered"),
]

PA_TRUE_PATTERNS = re.compile(
    r"\b(prior\s+auth(?:orization)?\s+required|pa\s+required|prior\s+auth\s+needed|requires?\s+pa)\b",
    re.IGNORECASE,
)
PA_FALSE_PATTERNS = re.compile(
    r"\b(no\s+prior\s+auth(?:orization)?|pa\s+not\s+required|does\s+not\s+require\s+pa)\b",
    re.IGNORECASE,
)


def normalize_coverage_status(raw: str, notes: list[str]) -> str:
    if not raw:
        notes.append(f"coverage_status_raw was empty; defaulting to 'covered'")
        return "covered"
    lower = raw.lower().strip()
    for phrase, status in COVERAGE_STATUS_MAP:
        if phrase in lower:
            return status
    notes.append(f"Could not map coverage_status_raw '{raw}' to a known status; defaulting to 'covered'")
    return "covered"


def normalize_pa_required(raw: str | None) -> bool | None:
    if not raw:
        return None
    if PA_TRUE_PATTERNS.search(raw):
        return True
    if PA_FALSE_PATTERNS.search(raw):
        return False
    return None


def _normalize_hcpcs(codes: list[str], notes: list[str]) -> list[str]:
    valid = []
    for code in codes:
        cleaned = code.strip().upper()
        if HCPCS_PATTERN.match(cleaned):
            valid.append(cleaned)
        else:
            notes.append(f"Discarded malformed HCPCS code: '{code}'")
    return list(dict.fromkeys(valid))


def _normalize_ndc(codes: list[str], notes: list[str]) -> list[str]:
    valid = []
    for code in codes:
        cleaned = re.sub(r"[\s\-]", "", code)
        if NDC_PATTERN.match(cleaned):
            valid.append(cleaned)
        else:
            notes.append(f"Discarded malformed NDC code: '{code}'")
    return list(dict.fromkeys(valid))


def _normalize_icd10(codes: list[str], notes: list[str]) -> list[str]:
    valid = []
    for code in codes:
        parsed = parse_icd10_code(code)
        if parsed:
            valid.append(parsed)
        else:
            notes.append(f"Discarded malformed ICD-10 code: '{code}'")
    return list(dict.fromkeys(valid))


@dataclass
class NormalizedDrug:
    drug_name: str
    generic_name: str | None = None
    hcpcs_codes: list[str] = field(default_factory=list)
    ndc_codes: list[str] = field(default_factory=list)
    biosimilar_of: str | None = None


@dataclass
class NormalizedCoverageRule:
    drug_name: str
    indication_name: str | None = None
    coverage_status: str = "covered"
    pa_required: bool | None = None
    step_therapy: list[str] = field(default_factory=list)
    criteria: list[str] = field(default_factory=list)
    coverage_tier: str | None = None
    approval_duration_days: int | None = None
    quantity_limits: list[str] = field(default_factory=list)
    notes: str | None = None


@dataclass
class NormalizedExtraction:
    drugs: list[NormalizedDrug] = field(default_factory=list)
    coverage_rules: list[NormalizedCoverageRule] = field(default_factory=list)
    icd10_codes: list[str] = field(default_factory=list)
    program_exceptions: list[str] = field(default_factory=list)
    extraction_notes: list[str] = field(default_factory=list)


def normalize(raw: RawExtraction) -> NormalizedExtraction:
    notes: list[str] = list(raw.extraction_notes)

    # First pass: normalize all drug names and build dedup index
    # Index maps every known name/alias (brand, generic) → canonical NormalizedDrug
    drugs_by_key: dict[str, NormalizedDrug] = {}

    def _register_drug(drug: NormalizedDrug) -> None:
        """Add a drug to the index under all its known name keys."""
        primary_key = drug.drug_name.lower()
        if primary_key not in drugs_by_key:
            drugs_by_key[primary_key] = drug
        else:
            # Merge into existing entry
            existing = drugs_by_key[primary_key]
            existing.hcpcs_codes = list(dict.fromkeys(existing.hcpcs_codes + drug.hcpcs_codes))
            existing.ndc_codes = list(dict.fromkeys(existing.ndc_codes + drug.ndc_codes))
            if not existing.generic_name and drug.generic_name:
                existing.generic_name = drug.generic_name
            if not existing.biosimilar_of and drug.biosimilar_of:
                existing.biosimilar_of = drug.biosimilar_of

        # Also register generic name as an alias pointing to same entry
        canonical = drugs_by_key[primary_key]
        if drug.generic_name:
            generic_key = drug.generic_name.lower()
            if generic_key not in drugs_by_key:
                drugs_by_key[generic_key] = canonical

    for d in raw.drugs:
        norm = NormalizedDrug(
            drug_name=normalize_drug_name(d.drug_name),
            generic_name=normalize_drug_name(d.generic_name) if d.generic_name else None,
            hcpcs_codes=_normalize_hcpcs(d.hcpcs_codes, notes),
            ndc_codes=_normalize_ndc(d.ndc_codes, notes),
            biosimilar_of=normalize_drug_name(d.biosimilar_of) if d.biosimilar_of else None,
        )
        _register_drug(norm)

    rules_by_key: dict[tuple[str, str | None], NormalizedCoverageRule] = {}

    for r in raw.coverage_rules:
        norm_drug_name = normalize_drug_name(r.drug_name)
        lookup_key = norm_drug_name.lower()
        indication = r.indication_name.strip() if r.indication_name else None

        # Resolve to canonical drug name (handles generic-name lookups)
        if lookup_key in drugs_by_key:
            canonical_name = drugs_by_key[lookup_key].drug_name
        else:
            # New drug only in rules — register it
            new_drug = NormalizedDrug(drug_name=norm_drug_name)
            _register_drug(new_drug)
            canonical_name = norm_drug_name
            notes.append(f"Added drug '{norm_drug_name}' from coverage_rules (not in drugs list)")

        norm_drug = canonical_name
        key = (norm_drug.lower(), indication.lower() if indication else None)

        if key in rules_by_key:
            existing = rules_by_key[key]
            existing.criteria = list(dict.fromkeys(existing.criteria + r.criteria_raw))
            existing.step_therapy = list(dict.fromkeys(existing.step_therapy + r.step_therapy_raw))
            notes.append(f"Merged duplicate rule for ({norm_drug}, {indication})")
        else:
            rules_by_key[key] = NormalizedCoverageRule(
                drug_name=norm_drug,
                indication_name=indication,
                coverage_status=normalize_coverage_status(r.coverage_status_raw, notes),
                pa_required=normalize_pa_required(r.pa_required_raw),
                step_therapy=list(r.step_therapy_raw),
                criteria=list(r.criteria_raw),
                coverage_tier=r.coverage_tier_raw,
                approval_duration_days=None,
                quantity_limits=list(r.quantity_limits_raw),
                notes=r.notes,
            )

    icd10 = _normalize_icd10(raw.icd10_codes, notes)

    # Deduplicated drug list: only unique canonical entries (not alias pointers)
    seen_ids: set[int] = set()
    deduped_drugs: list[NormalizedDrug] = []
    for drug in drugs_by_key.values():
        if id(drug) not in seen_ids:
            seen_ids.add(id(drug))
            deduped_drugs.append(drug)

    return NormalizedExtraction(
        drugs=deduped_drugs,
        coverage_rules=list(rules_by_key.values()),
        icd10_codes=icd10,
        program_exceptions=list(raw.program_exceptions),
        extraction_notes=notes,
    )
