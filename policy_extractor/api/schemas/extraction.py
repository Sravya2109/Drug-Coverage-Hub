from __future__ import annotations

from pydantic import BaseModel, Field


class DrugSchema(BaseModel):
    drug_name: str
    generic_name: str | None = None
    hcpcs_codes: list[str] = Field(default_factory=list)
    ndc_codes: list[str] = Field(default_factory=list)
    biosimilar_of: str | None = None


class CoverageRuleSchema(BaseModel):
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


class MetadataSchema(BaseModel):
    payer_name: str | None = None
    plan_name: str | None = None
    policy_id: str | None = None
    policy_type: str = "medical_policy"
    source_file: str = ""
    effective_date: str | None = None
    reviewed_date: str | None = None


class ExtractionResponse(BaseModel):
    metadata: MetadataSchema
    drugs: list[DrugSchema] = Field(default_factory=list)
    coverage_rules: list[CoverageRuleSchema] = Field(default_factory=list)
    icd10_codes: list[str] = Field(default_factory=list)
    program_exceptions: list[str] = Field(default_factory=list)
    extraction_notes: list[str] = Field(default_factory=list)
    validation_failed: bool = False
    validation_errors: list[str] = Field(default_factory=list)
    validation_warnings: list[str] = Field(default_factory=list)


class ValidationResultSchema(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    model: str
