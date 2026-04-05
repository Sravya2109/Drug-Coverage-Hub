import re

# Supports standard codes (A00.0) and ICD-10-CM 2025 alphanumeric subcodes (G35.A, G43.E01)
ICD10_PATTERN = re.compile(r"\b([A-Z]\d{2}(?:\.[A-Z0-9]{1,4})?)\b")
ICD10_VALID = re.compile(r"^[A-Z]\d{2}(\.[A-Z0-9]{1,4})?$")


def parse_icd10_code(raw: str) -> str | None:
    if not raw:
        return None
    code = raw.strip().upper()
    if ICD10_VALID.match(code):
        return code
    return None


def expand_icd10_range(start: str, end: str) -> list[str]:
    start = start.strip().upper()
    end = end.strip().upper()

    start_parsed = parse_icd10_code(start)
    end_parsed = parse_icd10_code(end)
    if not start_parsed or not end_parsed:
        return [c for c in (start_parsed, end_parsed) if c]

    # Only expand simple decimal ranges with same letter+two digits prefix
    prefix_pattern = re.compile(r"^([A-Z]\d{2})\.(\d+)$")
    start_m = prefix_pattern.match(start_parsed)
    end_m = prefix_pattern.match(end_parsed)

    if start_m and end_m and start_m.group(1) == end_m.group(1):
        prefix = start_m.group(1)
        s = int(start_m.group(2))
        e = int(end_m.group(2))
        if s <= e and (e - s) <= 50:
            return [f"{prefix}.{i}" for i in range(s, e + 1)]

    # Fallback: return both endpoints
    return list(dict.fromkeys([start_parsed, end_parsed]))


def extract_icd10_codes(text: str) -> list[str]:
    raw_codes = ICD10_PATTERN.findall(text)
    seen: dict[str, None] = {}
    for code in raw_codes:
        parsed = parse_icd10_code(code)
        if parsed:
            seen[parsed] = None
    return list(seen.keys())
