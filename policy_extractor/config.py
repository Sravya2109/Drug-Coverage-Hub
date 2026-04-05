import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).parent

# Load .env from the project root (one level above policy_extractor/)
load_dotenv(BASE_DIR.parent / ".env")


@dataclass
class Config:
    anthropic_api_key: str
    claude_model: str
    max_tokens_per_chunk: int
    llm_retry_attempts: int
    llm_retry_backoff_seconds: float
    temperature: float
    output_dir: Path
    coverage_status_enum: frozenset
    policy_type_enum: frozenset


COVERAGE_STATUS_ENUM: frozenset = frozenset({
    "covered",
    "not_covered",
    "restricted",
    "requires_pa",
    "investigational",
})

POLICY_TYPE_ENUM: frozenset = frozenset({
    "medical_policy",
    "formulary",
    "clinical_guideline",
})


def get_config() -> Config:
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    return Config(
        anthropic_api_key=api_key,
        claude_model=os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-6"),
        max_tokens_per_chunk=int(os.environ.get("MAX_TOKENS_PER_CHUNK", "4000")),
        llm_retry_attempts=int(os.environ.get("LLM_RETRY_ATTEMPTS", "3")),
        llm_retry_backoff_seconds=float(os.environ.get("LLM_RETRY_BACKOFF_SECONDS", "2")),
        temperature=float(os.environ.get("TEMPERATURE", "0")),
        output_dir=Path(os.environ.get("OUTPUT_DIR", str(BASE_DIR / "output"))),
        coverage_status_enum=COVERAGE_STATUS_ENUM,
        policy_type_enum=POLICY_TYPE_ENUM,
    )
