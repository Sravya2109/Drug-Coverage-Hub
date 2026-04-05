from __future__ import annotations

from dataclasses import dataclass, field

from policy_extractor.config import COVERAGE_STATUS_ENUM
from policy_extractor.services.enricher import EnrichedExtraction
from policy_extractor.utils.icd_utils import parse_icd10_code

HCPCS_IMPORT = None  # validated inline


@dataclass
class ValidationResult:
    valid: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def validate(output: EnrichedExtraction, source_was_nonempty: bool = True) -> ValidationResult:
    errors: list[str] = []
    warnings: list[str] = []

    # Hard errors
    seen_rule_keys: set[tuple[str, str | None]] = set()
    for i, rule in enumerate(output.coverage_rules):
        if not rule.drug_name or not rule.drug_name.strip():
            errors.append(f"coverage_rules[{i}]: drug_name is empty or missing")

        if rule.coverage_status not in COVERAGE_STATUS_ENUM:
            errors.append(
                f"coverage_rules[{i}] drug='{rule.drug_name}': "
                f"invalid coverage_status '{rule.coverage_status}'"
            )

        key = (
            (rule.drug_name or "").lower().strip(),
            (rule.indication_name or "").lower().strip() if rule.indication_name else None,
        )
        if key in seen_rule_keys:
            errors.append(
                f"Duplicate coverage rule for (drug='{rule.drug_name}', indication='{rule.indication_name}')"
            )
        seen_rule_keys.add(key)

    if source_was_nonempty and len(output.coverage_rules) == 0:
        errors.append("Non-empty source document produced zero coverage rules — extraction likely failed")

    # Warnings
    if not output.drugs or all(not d.drug_name for d in output.drugs):
        warnings.append("No drugs found in output")

    rule_drugs = {r.drug_name.lower() for r in output.coverage_rules if r.drug_name}
    for drug in output.drugs:
        if drug.drug_name and drug.drug_name.lower() not in rule_drugs:
            warnings.append(f"Drug '{drug.drug_name}' appears in drugs list but has no coverage rules")

    if output.extraction_notes:
        warnings.append(f"extraction_notes is non-empty ({len(output.extraction_notes)} notes) — review for extraction issues")

    # Validate codes in drugs
    import re
    hcpcs_pattern = re.compile(r"^[A-Z]\d{4}$")
    ndc_pattern = re.compile(r"^\d{10,11}$")
    for drug in output.drugs:
        for code in drug.hcpcs_codes:
            if not hcpcs_pattern.match(code):
                errors.append(f"Drug '{drug.drug_name}': malformed HCPCS code '{code}'")
        for code in drug.ndc_codes:
            cleaned = re.sub(r"[\s\-]", "", code)
            if not ndc_pattern.match(cleaned):
                errors.append(f"Drug '{drug.drug_name}': malformed NDC code '{code}'")

    for code in output.icd10_codes:
        if not parse_icd10_code(code):
            errors.append(f"Malformed ICD-10 code in output: '{code}'")

    return ValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
    )
