from __future__ import annotations

import re

SectionMap = dict[str, str]

SECTION_PATTERNS: list[tuple[str, list[str]]] = [
    ("header", [
        r"^(POLICY\s+HEADER|HEADER|POLICY\s+INFORMATION)",
    ]),
    ("position_statement", [
        r"^(POSITION\s+STATEMENT|POLICY\s+STATEMENT|MEDICAL\s+POLICY\s+STATEMENT)",
    ]),
    ("indications", [
        r"^(INDICATIONS?|COVERED\s+INDICATIONS?|CLINICAL\s+INDICATIONS?|INDICATIONS?\s+FOR\s+(USE|COVERAGE))",
    ]),
    ("coverage", [
        r"^(COVERAGE(\s+CRITERIA|\s+DETERMINATION|\s+POLICY|\s+GUIDELINES?)?)",
        r"^(COVERED\s+SERVICES?|MEDICAL\s+NECESSITY\s+CRITERIA|BENEFIT\s+COVERAGE)",
    ]),
    ("prior_authorization", [
        r"^(PRIOR\s+AUTHORIZATION(\s+CRITERIA|\s+REQUIREMENTS?)?)",
        r"^(PA\s+CRITERIA|PA\s+REQUIREMENTS?|AUTHORIZATION\s+CRITERIA)",
    ]),
    ("billing_coding", [
        r"^(BILLING\s+AND\s+CODING|BILLING\s+&\s+CODING|CODING\s+INFORMATION)",
        r"^(HCPCS\s+CODES?|CPT\s+CODES?|APPLICABLE\s+CODES?)",
    ]),
    ("icd10", [
        r"^(ICD[\s-]?10(\s+CODES?)?|DIAGNOSIS\s+CODES?|ICD[\s-]?10[\s-]?CM\s+CODES?)",
    ]),
    ("limitations", [
        r"^(LIMITATIONS?|COVERAGE\s+LIMITATIONS?|BENEFIT\s+LIMITATIONS?)",
    ]),
    ("exclusions", [
        r"^(EXCLUSIONS?|NON[\s-]?COVERED(\s+SERVICES?)?|COVERAGE\s+EXCLUSIONS?)",
    ]),
]

_compiled: list[tuple[str, re.Pattern]] = []
for section_key, patterns in SECTION_PATTERNS:
    for pat in patterns:
        _compiled.append((section_key, re.compile(pat, re.IGNORECASE | re.MULTILINE)))


def _detect_section(line: str) -> str | None:
    stripped = line.strip()
    if not stripped:
        return None
    for section_key, pattern in _compiled:
        if pattern.match(stripped):
            return section_key
    # Heuristic: all-caps line alone (no lowercase letters) that is short
    if stripped.isupper() and 3 <= len(stripped) <= 60 and stripped.replace(" ", "").isalpha():
        return "other_heading"
    return None


def split_sections(full_text: str) -> SectionMap:
    sections: SectionMap = {
        "header": "",
        "position_statement": "",
        "indications": "",
        "coverage": "",
        "prior_authorization": "",
        "billing_coding": "",
        "icd10": "",
        "limitations": "",
        "exclusions": "",
        "other": "",
    }

    lines = full_text.splitlines()
    current_key = "header"
    buffer: list[str] = []

    def flush(key: str, buf: list[str]) -> None:
        text = "\n".join(buf).strip()
        if text:
            if key in sections:
                sections[key] = (sections[key] + "\n" + text).strip() if sections[key] else text
            else:
                sections["other"] = (sections["other"] + "\n" + text).strip() if sections["other"] else text

    for line in lines:
        detected = _detect_section(line)
        if detected is not None and detected != "other_heading":
            flush(current_key, buffer)
            buffer = [line]
            current_key = detected
        elif detected == "other_heading":
            # Treat unknown all-caps headers as start of an "other" section
            flush(current_key, buffer)
            buffer = [line]
            current_key = "other"
        else:
            buffer.append(line)

    flush(current_key, buffer)

    # If nothing was detected at all, dump everything into other
    detected_content = sum(1 for k, v in sections.items() if k != "other" and v)
    if detected_content == 0 and not sections["other"]:
        sections["other"] = full_text

    return sections
