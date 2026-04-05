from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from policy_extractor.api.schemas.search import (
    CrossPayerComparisonResult,
    DrugCoverageResult,
    ICD10Result,
    IndicationResult,
    PARequirementResult,
    PayerSummary,
)
from policy_extractor.services.search_service import (
    compare_drug_across_payers,
    list_all_payers,
    list_payer_policies,
    search_by_drug,
    search_by_icd10,
    search_by_indication,
    search_pa_requirements,
)

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/drug", response_model=list[DrugCoverageResult], summary="Search coverage by drug name")
def drug_search(
    name: str = Query(..., description="Drug brand or generic name (partial match supported)"),
    payer: str | None = Query(None, description="Filter by payer name"),
    coverage_status: str | None = Query(None, description="Filter by status: covered, not_covered, requires_pa, restricted, investigational"),
):
    """
    Find coverage rules for a drug across all payers in the database.

    - Matches on both brand name and generic name
    - Optionally filter by payer or coverage status
    - Returns one row per (payer, indication) combination
    """
    try:
        results = search_by_drug(name, payer=payer, coverage_status=coverage_status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    if not results:
        raise HTTPException(status_code=404, detail=f"No coverage rules found for drug '{name}'")
    return results


@router.get("/indication", response_model=list[IndicationResult], summary="Search drugs covered for an indication")
def indication_search(
    name: str = Query(..., description="Indication or condition name (partial match supported)"),
    payer: str | None = Query(None, description="Filter by payer name"),
):
    """
    Find all drugs covered for a given clinical indication across all payers.

    Useful for: "What drugs does each payer cover for cervical dystonia?"
    """
    try:
        results = search_by_indication(name, payer=payer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    if not results:
        raise HTTPException(status_code=404, detail=f"No drugs found for indication '{name}'")
    return results


@router.get("/icd10", response_model=list[ICD10Result], summary="Search policies by ICD-10 code")
def icd10_search(
    code: str = Query(..., description="ICD-10-CM code (exact match, e.g. G24.3)"),
    payer: str | None = Query(None, description="Filter by payer name"),
):
    """
    Find all policies and associated drugs that list a specific ICD-10 diagnosis code.

    Useful for: "Which payers cover a drug for diagnosis G24.3?"
    """
    try:
        results = search_by_icd10(code, payer=payer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    if not results:
        raise HTTPException(status_code=404, detail=f"No policies found listing ICD-10 code '{code}'")
    return results


@router.get("/pa-requirements", response_model=list[PARequirementResult], summary="Get PA requirements for a drug")
def pa_requirements(
    drug: str = Query(..., description="Drug name (partial match supported)"),
):
    """
    Return prior authorization requirements for a drug across all payers.

    Includes criteria, step therapy prerequisites, and approval duration.
    Useful for: "What do I need to document to get Botox approved?"
    """
    try:
        results = search_pa_requirements(drug)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    if not results:
        raise HTTPException(status_code=404, detail=f"No PA requirements found for drug '{drug}'")
    return results


@router.get("/compare", response_model=list[CrossPayerComparisonResult], summary="Compare drug coverage across payers")
def compare_payers(
    drug: str = Query(..., description="Drug name to compare across payers"),
):
    """
    Side-by-side coverage comparison for a drug across all payers.

    Returns one row per (payer, indication) with coverage status, PA requirement, and tier.
    Useful for: "Which payers cover Myobloc and under what conditions?"
    """
    try:
        results = compare_drug_across_payers(drug)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    if not results:
        raise HTTPException(status_code=404, detail=f"No data found for drug '{drug}'")
    return results


@router.get("/payers", response_model=list[str], summary="List all payers in the database")
def get_payers():
    """
    Return all distinct payer names currently in the database.
    """
    try:
        return list_all_payers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payers/{payer_name}/policies", response_model=list[PayerSummary], summary="List all policies for a payer")
def get_payer_policies(payer_name: str):
    """
    Return a summary of all policy documents loaded for a specific payer.

    Shows drug count, rule count, and effective dates without full rule details.
    """
    try:
        results = list_payer_policies(payer_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    if not results:
        raise HTTPException(status_code=404, detail=f"No policies found for payer '{payer_name}'")
    return results
