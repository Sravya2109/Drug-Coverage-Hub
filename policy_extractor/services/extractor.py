from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass, field
from pathlib import Path

from policy_extractor.services.section_splitter import SectionMap
from policy_extractor.utils.text_utils import split_into_chunks

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "extract_prompt.txt"

SECTIONS_TO_EXTRACT = ["coverage", "indications", "prior_authorization", "icd10", "other"]


@dataclass
class RawDrug:
    drug_name: str
    generic_name: str | None = None
    hcpcs_codes: list[str] = field(default_factory=list)
    ndc_codes: list[str] = field(default_factory=list)
    biosimilar_of: str | None = None


@dataclass
class RawCoverageRule:
    drug_name: str
    indication_name: str | None = None
    coverage_status_raw: str = ""
    pa_required_raw: str | None = None
    step_therapy_raw: list[str] = field(default_factory=list)
    criteria_raw: list[str] = field(default_factory=list)
    coverage_tier_raw: str | None = None
    approval_duration_raw: str | None = None
    quantity_limits_raw: list[str] = field(default_factory=list)
    notes: str | None = None


@dataclass
class RawExtraction:
    drugs: list[RawDrug] = field(default_factory=list)
    coverage_rules: list[RawCoverageRule] = field(default_factory=list)
    icd10_codes: list[str] = field(default_factory=list)
    program_exceptions: list[str] = field(default_factory=list)
    extraction_notes: list[str] = field(default_factory=list)


def _load_prompt() -> str:
    return PROMPT_PATH.read_text()


def _fill_prompt(template: str, section_type: str, payer_name: str, section_text: str) -> str:
    return (
        template
        .replace("{{section_type}}", section_type)
        .replace("{{payer_name}}", payer_name or "Unknown")
        .replace("{{section_text}}", section_text)
    )


def _strip_fences(text: str) -> str:
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _parse_llm_response(raw_text: str) -> dict:
    return json.loads(_strip_fences(raw_text))


def _call_llm(prompt: str, client, config) -> dict | None:
    for attempt in range(1, config.llm_retry_attempts + 1):
        try:
            response = client.messages.create(
                model=config.claude_model,
                max_tokens=4096,
                temperature=config.temperature,
                messages=[{"role": "user", "content": prompt}],
            )
            return _parse_llm_response(response.content[0].text)
        except json.JSONDecodeError as e:
            if attempt == config.llm_retry_attempts:
                return None
            time.sleep(config.llm_retry_backoff_seconds * attempt)
        except Exception as e:
            if attempt == config.llm_retry_attempts:
                return None
            time.sleep(config.llm_retry_backoff_seconds * attempt)
    return None


def _result_to_raw_extraction(result: dict) -> RawExtraction:
    drugs = []
    for d in result.get("drugs") or []:
        if not d.get("drug_name"):
            continue
        drugs.append(RawDrug(
            drug_name=d["drug_name"],
            generic_name=d.get("generic_name"),
            hcpcs_codes=d.get("hcpcs_codes") or [],
            ndc_codes=d.get("ndc_codes") or [],
            biosimilar_of=d.get("biosimilar_of"),
        ))

    rules = []
    for r in result.get("coverage_rules") or []:
        if not r.get("drug_name"):
            continue
        rules.append(RawCoverageRule(
            drug_name=r["drug_name"],
            indication_name=r.get("indication_name"),
            coverage_status_raw=r.get("coverage_status_raw") or "",
            pa_required_raw=r.get("pa_required_raw"),
            step_therapy_raw=r.get("step_therapy_raw") or [],
            criteria_raw=r.get("criteria_raw") or [],
            coverage_tier_raw=r.get("coverage_tier_raw"),
            approval_duration_raw=r.get("approval_duration_raw"),
            quantity_limits_raw=r.get("quantity_limits_raw") or [],
            notes=r.get("notes"),
        ))

    return RawExtraction(
        drugs=drugs,
        coverage_rules=rules,
        icd10_codes=result.get("icd10_codes") or [],
        program_exceptions=result.get("program_exceptions") or [],
        extraction_notes=result.get("extraction_notes") or [],
    )


def _merge_extractions(extractions: list[RawExtraction]) -> RawExtraction:
    merged = RawExtraction()
    seen_drugs: dict[str, RawDrug] = {}

    for ext in extractions:
        for drug in ext.drugs:
            key = drug.drug_name.lower().strip()
            if key not in seen_drugs:
                seen_drugs[key] = drug
            else:
                existing = seen_drugs[key]
                existing.hcpcs_codes = list(dict.fromkeys(existing.hcpcs_codes + drug.hcpcs_codes))
                existing.ndc_codes = list(dict.fromkeys(existing.ndc_codes + drug.ndc_codes))
                if not existing.generic_name and drug.generic_name:
                    existing.generic_name = drug.generic_name
                if not existing.biosimilar_of and drug.biosimilar_of:
                    existing.biosimilar_of = drug.biosimilar_of

        merged.coverage_rules.extend(ext.coverage_rules)
        merged.icd10_codes.extend(ext.icd10_codes)
        merged.program_exceptions.extend(ext.program_exceptions)
        merged.extraction_notes.extend(ext.extraction_notes)

    merged.drugs = list(seen_drugs.values())
    merged.icd10_codes = list(dict.fromkeys(merged.icd10_codes))
    merged.program_exceptions = list(dict.fromkeys(merged.program_exceptions))

    return merged


def extract_from_sections(section_map: SectionMap, payer_name: str) -> RawExtraction:
    from policy_extractor.config import get_config
    import anthropic

    config = get_config()
    client = anthropic.Anthropic(api_key=config.anthropic_api_key)
    prompt_template = _load_prompt()

    all_extractions: list[RawExtraction] = []

    for section_key in SECTIONS_TO_EXTRACT:
        section_text = section_map.get(section_key, "").strip()
        if not section_text:
            continue

        chunks = split_into_chunks(section_text, config.max_tokens_per_chunk * 4)  # ~4 chars per token estimate

        for i, chunk in enumerate(chunks):
            prompt = _fill_prompt(prompt_template, section_key, payer_name, chunk)
            result = _call_llm(prompt, client, config)

            if result is None:
                all_extractions.append(RawExtraction(
                    extraction_notes=[
                        f"LLM extraction failed after {config.llm_retry_attempts} retries "
                        f"for section '{section_key}' chunk {i + 1}/{len(chunks)}"
                    ]
                ))
            else:
                ext = _result_to_raw_extraction(result)
                all_extractions.append(ext)

    return _merge_extractions(all_extractions)
