from __future__ import annotations

import os
import re
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent.parent / ".env")

MONGODB_URI = os.environ.get("MONGODB_URI", "")
MONGODB_DB = os.environ.get("MONGODB_DB", "policy_tracker")
MONGODB_COLLECTION = os.environ.get("MONGODB_COLLECTION", "drug_coverage_hub")


def _get_collection():
    from pymongo import MongoClient
    client = MongoClient(MONGODB_URI)
    return client, client[MONGODB_DB][MONGODB_COLLECTION]


def _drug_regex(name: str) -> re.Pattern:
    return re.compile(re.escape(name.strip()), re.IGNORECASE)


# ---------------------------------------------------------------------------
# Drug search — coverage across all payers
# ---------------------------------------------------------------------------

def search_by_drug(drug_name: str, payer: str | None = None, coverage_status: str | None = None) -> list[dict]:
    """
    Return all coverage rules for a drug, optionally filtered by payer and/or status.
    Aggregates across all policy documents in the collection.
    """
    client, col = _get_collection()
    try:
        drug_re = _drug_regex(drug_name)

        match_stage: dict = {
            "$or": [
                {"drugs.drug_name": drug_re},
                {"drugs.generic_name": drug_re},
                {"coverage_rules.drug_name": drug_re},
            ]
        }
        if payer:
            match_stage["metadata.payer_name"] = _drug_regex(payer)

        pipeline = [
            {"$match": match_stage},
            {"$project": {
                "payer_name": "$metadata.payer_name",
                "policy_id": "$metadata.policy_id",
                "policy_type": "$metadata.policy_type",
                "effective_date": "$metadata.effective_date",
                "coverage_rules": {
                    "$filter": {
                        "input": "$coverage_rules",
                        "as": "rule",
                        "cond": {"$regexMatch": {
                            "input": "$$rule.drug_name",
                            "regex": drug_name,
                            "options": "i"
                        }}
                    }
                },
                "drugs": {
                    "$filter": {
                        "input": "$drugs",
                        "as": "drug",
                        "cond": {
                            "$or": [
                                {"$regexMatch": {"input": "$$drug.drug_name", "regex": drug_name, "options": "i"}},
                                {"$regexMatch": {"input": {"$ifNull": ["$$drug.generic_name", ""]}, "regex": drug_name, "options": "i"}},
                            ]
                        }
                    }
                }
            }},
            {"$unwind": {"path": "$coverage_rules", "preserveNullAndEmptyArrays": False}},
        ]

        if coverage_status:
            pipeline.append({"$match": {"coverage_rules.coverage_status": coverage_status}})

        pipeline.append({"$project": {
            "_id": 0,
            "payer_name": 1,
            "policy_id": 1,
            "policy_type": 1,
            "effective_date": 1,
            "drug_name": "$coverage_rules.drug_name",
            "indication_name": "$coverage_rules.indication_name",
            "coverage_status": "$coverage_rules.coverage_status",
            "pa_required": "$coverage_rules.pa_required",
            "step_therapy": "$coverage_rules.step_therapy",
            "criteria": "$coverage_rules.criteria",
            "coverage_tier": "$coverage_rules.coverage_tier",
            "approval_duration_days": "$coverage_rules.approval_duration_days",
            "quantity_limits": "$coverage_rules.quantity_limits",
            "notes": "$coverage_rules.notes",
            "hcpcs_codes": {"$arrayElemAt": ["$drugs.hcpcs_codes", 0]},
        }})

        pipeline.append({"$sort": {"payer_name": 1, "indication_name": 1}})

        return list(col.aggregate(pipeline))
    finally:
        client.close()


# ---------------------------------------------------------------------------
# Indication search — drugs covered for a condition
# ---------------------------------------------------------------------------

def search_by_indication(indication: str, payer: str | None = None) -> list[dict]:
    """
    Return all drugs covered for a given indication/condition across payers.
    """
    client, col = _get_collection()
    try:
        ind_re = _drug_regex(indication)

        match_stage: dict = {"coverage_rules.indication_name": ind_re}
        if payer:
            match_stage["metadata.payer_name"] = _drug_regex(payer)

        pipeline = [
            {"$match": match_stage},
            {"$project": {
                "payer_name": "$metadata.payer_name",
                "policy_id": "$metadata.policy_id",
                "effective_date": "$metadata.effective_date",
                "coverage_rules": {
                    "$filter": {
                        "input": "$coverage_rules",
                        "as": "rule",
                        "cond": {"$regexMatch": {
                            "input": {"$ifNull": ["$$rule.indication_name", ""]},
                            "regex": indication,
                            "options": "i"
                        }}
                    }
                }
            }},
            {"$unwind": "$coverage_rules"},
            {"$project": {
                "_id": 0,
                "payer_name": 1,
                "policy_id": 1,
                "effective_date": 1,
                "drug_name": "$coverage_rules.drug_name",
                "indication_name": "$coverage_rules.indication_name",
                "coverage_status": "$coverage_rules.coverage_status",
                "pa_required": "$coverage_rules.pa_required",
                "step_therapy": "$coverage_rules.step_therapy",
                "criteria": "$coverage_rules.criteria",
                "approval_duration_days": "$coverage_rules.approval_duration_days",
            }},
            {"$sort": {"coverage_status": 1, "payer_name": 1, "drug_name": 1}},
        ]

        return list(col.aggregate(pipeline))
    finally:
        client.close()


# ---------------------------------------------------------------------------
# ICD-10 search — drugs covered for a diagnosis code
# ---------------------------------------------------------------------------

def search_by_icd10(icd10_code: str, payer: str | None = None) -> list[dict]:
    """
    Return all policies/drugs that list this ICD-10 code.
    """
    client, col = _get_collection()
    try:
        code = icd10_code.strip().upper()
        match_stage: dict = {"icd10_codes": code}
        if payer:
            match_stage["metadata.payer_name"] = _drug_regex(payer)

        pipeline = [
            {"$match": match_stage},
            {"$project": {
                "_id": 0,
                "payer_name": "$metadata.payer_name",
                "policy_id": "$metadata.policy_id",
                "policy_type": "$metadata.policy_type",
                "effective_date": "$metadata.effective_date",
                "drugs": "$drugs",
                "coverage_rules": "$coverage_rules",
                "icd10_codes": "$icd10_codes",
            }},
            {"$sort": {"payer_name": 1}},
        ]

        return list(col.aggregate(pipeline))
    finally:
        client.close()


# ---------------------------------------------------------------------------
# PA requirements — prior auth needed for a drug across payers
# ---------------------------------------------------------------------------

def search_pa_requirements(drug_name: str) -> list[dict]:
    """
    Return PA requirements for a drug across all payers.
    """
    client, col = _get_collection()
    try:
        drug_re = _drug_regex(drug_name)
        pipeline = [
            {"$match": {"coverage_rules.drug_name": drug_re}},
            {"$project": {
                "payer_name": "$metadata.payer_name",
                "policy_id": "$metadata.policy_id",
                "effective_date": "$metadata.effective_date",
                "coverage_rules": {
                    "$filter": {
                        "input": "$coverage_rules",
                        "as": "rule",
                        "cond": {"$regexMatch": {
                            "input": "$$rule.drug_name",
                            "regex": drug_name,
                            "options": "i"
                        }}
                    }
                }
            }},
            {"$unwind": "$coverage_rules"},
            {"$project": {
                "_id": 0,
                "payer_name": 1,
                "policy_id": 1,
                "effective_date": 1,
                "drug_name": "$coverage_rules.drug_name",
                "indication_name": "$coverage_rules.indication_name",
                "pa_required": "$coverage_rules.pa_required",
                "criteria": "$coverage_rules.criteria",
                "step_therapy": "$coverage_rules.step_therapy",
                "approval_duration_days": "$coverage_rules.approval_duration_days",
            }},
            {"$sort": {"payer_name": 1, "indication_name": 1}},
        ]
        return list(col.aggregate(pipeline))
    finally:
        client.close()


# ---------------------------------------------------------------------------
# Cross-payer comparison — coverage status for a drug across all payers
# ---------------------------------------------------------------------------

def compare_drug_across_payers(drug_name: str) -> list[dict]:
    """
    Summary view: for each payer, what is the coverage status for this drug?
    Groups by payer + indication for easy side-by-side comparison.
    """
    client, col = _get_collection()
    try:
        drug_re = _drug_regex(drug_name)
        pipeline = [
            {"$match": {"coverage_rules.drug_name": drug_re}},
            {"$project": {
                "payer_name": "$metadata.payer_name",
                "policy_id": "$metadata.policy_id",
                "effective_date": "$metadata.effective_date",
                "coverage_rules": {
                    "$filter": {
                        "input": "$coverage_rules",
                        "as": "rule",
                        "cond": {"$regexMatch": {
                            "input": "$$rule.drug_name",
                            "regex": drug_name,
                            "options": "i"
                        }}
                    }
                }
            }},
            {"$unwind": "$coverage_rules"},
            {"$group": {
                "_id": {
                    "payer_name": "$payer_name",
                    "indication_name": "$coverage_rules.indication_name",
                },
                "payer_name": {"$first": "$payer_name"},
                "policy_id": {"$first": "$policy_id"},
                "effective_date": {"$first": "$effective_date"},
                "drug_name": {"$first": "$coverage_rules.drug_name"},
                "indication_name": {"$first": "$coverage_rules.indication_name"},
                "coverage_status": {"$first": "$coverage_rules.coverage_status"},
                "pa_required": {"$first": "$coverage_rules.pa_required"},
                "coverage_tier": {"$first": "$coverage_rules.coverage_tier"},
            }},
            {"$project": {"_id": 0}},
            {"$sort": {"indication_name": 1, "payer_name": 1}},
        ]
        return list(col.aggregate(pipeline))
    finally:
        client.close()


# ---------------------------------------------------------------------------
# Payer summary — all drugs/policies for a payer
# ---------------------------------------------------------------------------

def list_payer_policies(payer_name: str) -> list[dict]:
    """
    Return all policy summaries (no full rule details) for a payer.
    """
    client, col = _get_collection()
    try:
        pipeline = [
            {"$match": {"metadata.payer_name": _drug_regex(payer_name)}},
            {"$project": {
                "_id": 0,
                "payer_name": "$metadata.payer_name",
                "policy_id": "$metadata.policy_id",
                "policy_type": "$metadata.policy_type",
                "effective_date": "$metadata.effective_date",
                "drug_count": {"$size": "$drugs"},
                "rule_count": {"$size": "$coverage_rules"},
                "drugs": "$drugs.drug_name",
            }},
            {"$sort": {"policy_id": 1}},
        ]
        return list(col.aggregate(pipeline))
    finally:
        client.close()


# ---------------------------------------------------------------------------
# List all payers in the collection
# ---------------------------------------------------------------------------

def list_all_payers() -> list[str]:
    client, col = _get_collection()
    try:
        return sorted(col.distinct("metadata.payer_name"))
    finally:
        client.close()
