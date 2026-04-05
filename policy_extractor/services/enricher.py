from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

from policy_extractor.services.normalizer import NormalizedCoverageRule, NormalizedDrug, NormalizedExtraction
from policy_extractor.utils.icd_utils import expand_icd10_range, parse_icd10_code

DATA_DIR = Path(__file__).parent.parent / "data"

_biosimilar_map: dict = {}


def _load_biosimilar_map() -> None:
    global _biosimilar_map
    if _biosimilar_map:
        return
    bio_file = DATA_DIR / "biosimilar_map.json"
    if bio_file.exists():
        with open(bio_file) as f:
            _biosimilar_map = json.load(f)


STEP_THERAPY_PATTERNS = re.compile(
    r"(?:must\s+have\s+tried|failure\s+of|after\s+(?:a\s+)?(?:trial|adequate\s+trial)\s+of|"
    r"step\s+therapy\s+(?:with|through|failure)|requires?\s+(?:prior\s+)?trial\s+of)\s+"
    r"([A-Z][a-zA-Z0-9\s\-]+?)(?:[,;.]|$|\band\b|\bor\b)",
    re.IGNORECASE,
)

DURATION_PATTERNS: list[tuple[re.Pattern, callable]] = [
    (re.compile(r"(\d+)\s+year(?:s)?", re.IGNORECASE), lambda m: int(m.group(1)) * 365),
    (re.compile(r"(\d+)\s+month(?:s)?", re.IGNORECASE), lambda m: int(m.group(1)) * 30),
    (re.compile(r"(\d+)\s+week(?:s)?", re.IGNORECASE), lambda m: int(m.group(1)) * 7),
    (re.compile(r"(\d+)\s+day(?:s)?", re.IGNORECASE), lambda m: int(m.group(1))),
]

ICD10_RANGE_PATTERN = re.compile(r"([A-Z]\d{2}(?:\.\d{1,4})?)\s*[\-\–\—]\s*([A-Z]\d{2}(?:\.\d{1,4})?)")

BIOSIMILAR_SUFFIX_PATTERN = re.compile(r"-[a-z]{4}$", re.IGNORECASE)

PROGRAM_EXCEPTION_PATTERNS = re.compile(
    r"\b(patient\s+assistance\s+program|specialty\s+pharmacy\s+exception|"
    r"manufacturer['\s]+s?\s+(?:patient\s+)?assistance|"
    r"co[\-\s]?pay\s+assistance|foundation\s+program|"
    r"free\s+drug\s+program|compassionate\s+use|expanded\s+access)\b",
    re.IGNORECASE,
)


def _extract_step_therapy_drugs(raw_strings: list[str]) -> list[str]:
    extracted = []
    for s in raw_strings:
        for m in STEP_THERAPY_PATTERNS.finditer(s):
            drug = m.group(1).strip().rstrip(",;.")
            if drug:
                extracted.append(drug)
    return list(dict.fromkeys(extracted)) if extracted else raw_strings


def _parse_approval_duration(raw: str | None) -> int | None:
    if not raw:
        return None
    for pattern, converter in DURATION_PATTERNS:
        m = pattern.search(raw)
        if m:
            try:
                return converter(m)
            except Exception:
                continue
    return None


def _expand_icd10_ranges(codes: list[str], notes: list[str]) -> list[str]:
    result = []
    range_pattern = ICD10_RANGE_PATTERN

    i = 0
    while i < len(codes):
        code = codes[i]
        # Check if this code and the next form a range
        if i + 1 < len(codes):
            pair = f"{codes[i]}-{codes[i+1]}"
            m = range_pattern.fullmatch(pair.replace(" ", ""))
            if m:
                expanded = expand_icd10_range(codes[i], codes[i + 1])
                result.extend(expanded)
                notes.append(f"Expanded ICD-10 range {codes[i]}-{codes[i+1]} to {len(expanded)} codes")
                i += 2
                continue
        if parse_icd10_code(code):
            result.append(code)
        i += 1

    return list(dict.fromkeys(result))


def _detect_biosimilar(drug: NormalizedDrug, notes: list[str]) -> str | None:
    _load_biosimilar_map()
    if drug.biosimilar_of:
        return drug.biosimilar_of

    name_lower = drug.drug_name.lower()

    # Check suffix pattern first
    if BIOSIMILAR_SUFFIX_PATTERN.search(drug.drug_name):
        for group_data in _biosimilar_map.values():
            for biosimilar_name in group_data.get("biosimilars", []):
                if biosimilar_name.lower() in name_lower or name_lower in biosimilar_name.lower():
                    notes.append(f"Detected '{drug.drug_name}' as biosimilar of '{group_data['reference_product']}'")
                    return group_data["reference_product"]

    # Check biosimilar names list directly
    for group_data in _biosimilar_map.values():
        for biosimilar_name in group_data.get("biosimilars", []):
            if biosimilar_name.lower() == name_lower:
                notes.append(f"Detected '{drug.drug_name}' as biosimilar of '{group_data['reference_product']}'")
                return group_data["reference_product"]

    return None


def _extract_program_exceptions(text_sources: list[str], existing: list[str]) -> list[str]:
    found = list(existing)
    for text in text_sources:
        for m in PROGRAM_EXCEPTION_PATTERNS.finditer(text):
            exc = m.group(0).strip()
            if exc not in found:
                found.append(exc)
    return found


@dataclass
class EnrichedExtraction:
    drugs: list[NormalizedDrug] = field(default_factory=list)
    coverage_rules: list[NormalizedCoverageRule] = field(default_factory=list)
    icd10_codes: list[str] = field(default_factory=list)
    program_exceptions: list[str] = field(default_factory=list)
    extraction_notes: list[str] = field(default_factory=list)


def enrich(normalized: NormalizedExtraction) -> EnrichedExtraction:
    notes = list(normalized.extraction_notes)

    # Enrich drugs: biosimilar detection
    drugs = []
    for drug in normalized.drugs:
        biosimilar_of = _detect_biosimilar(drug, notes)
        drugs.append(NormalizedDrug(
            drug_name=drug.drug_name,
            generic_name=drug.generic_name,
            hcpcs_codes=drug.hcpcs_codes,
            ndc_codes=drug.ndc_codes,
            biosimilar_of=biosimilar_of,
        ))

    # Enrich coverage rules: step therapy, approval duration
    rules = []
    all_notes_text = []
    for rule in normalized.coverage_rules:
        step_therapy = _extract_step_therapy_drugs(rule.step_therapy)
        approval_days = _parse_approval_duration(rule.approval_duration_days if isinstance(rule.approval_duration_days, str) else None)
        if approval_days is None and hasattr(rule, "_approval_duration_raw"):
            approval_days = _parse_approval_duration(rule._approval_duration_raw)

        # Collect text for program exception scanning
        all_notes_text.extend(rule.criteria)
        all_notes_text.extend(rule.step_therapy)
        if rule.notes:
            all_notes_text.append(rule.notes)

        rules.append(NormalizedCoverageRule(
            drug_name=rule.drug_name,
            indication_name=rule.indication_name,
            coverage_status=rule.coverage_status,
            pa_required=rule.pa_required,
            step_therapy=step_therapy,
            criteria=rule.criteria,
            coverage_tier=rule.coverage_tier,
            approval_duration_days=rule.approval_duration_days if rule.approval_duration_days is not None else approval_days,
            quantity_limits=rule.quantity_limits,
            notes=rule.notes,
        ))

    # Expand ICD-10 ranges
    icd10 = _expand_icd10_ranges(normalized.icd10_codes, notes)

    # Extract program exceptions from free text
    program_exceptions = _extract_program_exceptions(all_notes_text, normalized.program_exceptions)

    return EnrichedExtraction(
        drugs=drugs,
        coverage_rules=rules,
        icd10_codes=icd10,
        program_exceptions=program_exceptions,
        extraction_notes=notes,
    )
