from __future__ import annotations

from pydantic import BaseModel, Field


class DrugCoverageResult(BaseModel):
    payer_name: str | None = None
    policy_id: str | None = None
    policy_type: str | None = None
    effective_date: str | None = None
    drug_name: str
    indication_name: str | None = None
    coverage_status: str
    pa_required: bool | None = None
    step_therapy: list[str] = Field(default_factory=list)
    criteria: list[str] = Field(default_factory=list)
    coverage_tier: str | None = None
    approval_duration_days: int | None = None
    quantity_limits: list[str] = Field(default_factory=list)
    notes: str | None = None
    hcpcs_codes: list[str] = Field(default_factory=list)


class IndicationResult(BaseModel):
    payer_name: str | None = None
    policy_id: str | None = None
    effective_date: str | None = None
    drug_name: str
    indication_name: str | None = None
    coverage_status: str
    pa_required: bool | None = None
    step_therapy: list[str] = Field(default_factory=list)
    criteria: list[str] = Field(default_factory=list)
    approval_duration_days: int | None = None


class ICD10Result(BaseModel):
    payer_name: str | None = None
    policy_id: str | None = None
    policy_type: str | None = None
    effective_date: str | None = None
    drugs: list[dict] = Field(default_factory=list)
    coverage_rules: list[dict] = Field(default_factory=list)
    icd10_codes: list[str] = Field(default_factory=list)


class PARequirementResult(BaseModel):
    payer_name: str | None = None
    policy_id: str | None = None
    effective_date: str | None = None
    drug_name: str
    indication_name: str | None = None
    pa_required: bool | None = None
    criteria: list[str] = Field(default_factory=list)
    step_therapy: list[str] = Field(default_factory=list)
    approval_duration_days: int | None = None


class CrossPayerComparisonResult(BaseModel):
    payer_name: str | None = None
    policy_id: str | None = None
    effective_date: str | None = None
    drug_name: str
    indication_name: str | None = None
    coverage_status: str
    pa_required: bool | None = None
    coverage_tier: str | None = None


class PayerSummary(BaseModel):
    payer_name: str | None = None
    policy_id: str | None = None
    policy_type: str | None = None
    effective_date: str | None = None
    drug_count: int = 0
    rule_count: int = 0
    drugs: list[str] = Field(default_factory=list)
