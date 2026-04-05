from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

from policy_extractor.utils.text_utils import normalize_date

DATA_DIR = Path(__file__).parent.parent / "data"

_payer_aliases: dict[str, str] = {}
_payer_keywords: list[str] = []


def _load_payer_aliases() -> None:
    global _payer_aliases, _payer_keywords
    if _payer_aliases:
        return
    alias_file = DATA_DIR / "payer_aliases.json"
    if alias_file.exists():
        with open(alias_file) as f:
            _payer_aliases = json.load(f)
    _payer_keywords = list(_payer_aliases.keys()) + list(set(_payer_aliases.values()))


@dataclass
class Metadata:
    payer_name: str | None
    plan_name: str | None
    policy_id: str | None
    policy_type: str
    source_file: str
    effective_date: str | None
    reviewed_date: str | None
    extraction_notes: list[str] = field(default_factory=list)


DATE_PATTERN = re.compile(
    r"\b(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}"
    r"|(?:January|February|March|April|May|June|July|August|September|October|November|December)"
    r"\s+\d{1,2},?\s+\d{4}"
    r"|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
    r"\s+\d{1,2},?\s+\d{4}"
    r"|\d{4}[/\-]\d{2}[/\-]\d{2})\b",
    re.IGNORECASE,
)

POLICY_ID_PATTERN = re.compile(
    r"(?:"
    # Explicit keyword prefix: "Policy #", "Policy ID:", "Policy Number:", etc.
    r"Policy\s*(?:#|ID|Number|No\.?)\s*:?\s*([A-Z0-9][\w\-\.]{2,20})"
    r"|"
    # Known payer policy ID prefixes followed by alphanumeric ID (word boundary required)
    r"\b((?:MP|LCR|LCD|NCD|CS|POL|DRUG|MBD)[\s\-]\d[\w\-\.]{1,15})"
    r")",
    re.IGNORECASE,
)

EFFECTIVE_DATE_CONTEXT = re.compile(
    r"(?:Effective(?:\s+Date)?|Date\s+of\s+Origin|Origination\s+Date)\s*:?\s*(" + DATE_PATTERN.pattern + r")",
    re.IGNORECASE,
)

REVIEWED_DATE_CONTEXT = re.compile(
    r"(?:Last\s+Reviewed|Last\s+Review\s+Date|Revised|Review\s+Date|Date\s+Revised)\s*:?\s*(" + DATE_PATTERN.pattern + r")",
    re.IGNORECASE,
)

POLICY_TYPE_KEYWORDS: list[tuple[str, str]] = [
    ("formulary", "formulary"),
    ("drug list", "formulary"),
    ("clinical guideline", "clinical_guideline"),
    ("clinical policy", "clinical_guideline"),
    ("medical policy", "medical_policy"),
    ("coverage policy", "medical_policy"),
    ("coverage determination", "medical_policy"),
    ("medical necessity", "medical_policy"),
]


def _normalize_payer_name(raw: str) -> str:
    _load_payer_aliases()
    for alias, canonical in _payer_aliases.items():
        if alias.lower() in raw.lower():
            return canonical
    return raw.strip()


def _extract_payer_name_regex(text: str) -> str | None:
    _load_payer_aliases()
    lines = text.splitlines()
    for line in lines[:20]:
        stripped = line.strip()
        if not stripped:
            continue
        for keyword in _payer_keywords:
            if keyword.lower() in stripped.lower():
                return _normalize_payer_name(stripped)
    # Fallback: first non-empty line
    for line in lines[:5]:
        if line.strip():
            return line.strip()
    return None


def _extract_policy_id_regex(text: str) -> str | None:
    m = POLICY_ID_PATTERN.search(text[:2000])
    if m:
        # group(1) = explicit keyword match, group(2) = prefix-based match
        return (m.group(1) or m.group(2)).strip()
    return None


def _extract_effective_date_regex(text: str) -> str | None:
    m = EFFECTIVE_DATE_CONTEXT.search(text[:3000])
    if m:
        raw = m.group(1)
        return normalize_date(raw)
    return None


def _extract_reviewed_date_regex(text: str) -> str | None:
    m = REVIEWED_DATE_CONTEXT.search(text[:3000])
    if m:
        raw = m.group(1)
        return normalize_date(raw)
    return None


def _detect_policy_type(text: str) -> str:
    snippet = text[:500].lower()
    for keyword, policy_type in POLICY_TYPE_KEYWORDS:
        if keyword in snippet:
            return policy_type
    return "medical_policy"


def _llm_fallback_metadata(header_text: str, missing_fields: list[str]) -> dict:
    from policy_extractor.config import get_config
    import anthropic

    config = get_config()
    if not config.anthropic_api_key:
        return {}

    fields_str = ", ".join(missing_fields)
    prompt = f"""Extract the following fields from this medical policy header text: {fields_str}.

Return ONLY a JSON object with these exact keys: {fields_str}.
Use null for any field you cannot find. Do not add extra keys.

HEADER TEXT:
{header_text[:1500]}"""

    client = anthropic.Anthropic(api_key=config.anthropic_api_key)
    try:
        response = client.messages.create(
            model=config.claude_model,
            max_tokens=300,
            temperature=config.temperature,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        # Strip markdown fences if present
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        return json.loads(text)
    except Exception:
        return {}


def extract_metadata(header_text: str, full_text: str, source_file: str) -> Metadata:
    notes: list[str] = []

    payer_name = _extract_payer_name_regex(header_text or full_text[:500])
    policy_id = _extract_policy_id_regex(header_text or full_text[:2000])
    effective_date = _extract_effective_date_regex(header_text or full_text[:3000])
    reviewed_date = _extract_reviewed_date_regex(header_text or full_text[:3000])
    policy_type = _detect_policy_type(full_text)

    missing = []
    if not payer_name:
        missing.append("payer_name")
    if not policy_id:
        missing.append("policy_id")
    if not effective_date:
        missing.append("effective_date")

    if missing:
        notes.append(f"LLM fallback used for fields: {', '.join(missing)}")
        fallback = _llm_fallback_metadata(header_text or full_text[:1500], missing)
        if "payer_name" in missing and fallback.get("payer_name"):
            payer_name = _normalize_payer_name(fallback["payer_name"])
        if "policy_id" in missing and fallback.get("policy_id"):
            policy_id = fallback["policy_id"]
        if "effective_date" in missing and fallback.get("effective_date"):
            effective_date = normalize_date(fallback["effective_date"])

    return Metadata(
        payer_name=payer_name,
        plan_name=None,
        policy_id=policy_id,
        policy_type=policy_type,
        source_file=source_file,
        effective_date=effective_date,
        reviewed_date=reviewed_date,
        extraction_notes=notes,
    )
