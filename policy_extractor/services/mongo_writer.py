from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent.parent / ".env")

MONGODB_URI = os.environ.get("MONGODB_URI", "")
MONGODB_DB = os.environ.get("MONGODB_DB", "policy_tracker")
MONGODB_COLLECTION = os.environ.get("MONGODB_COLLECTION", "drug_coverage_hub")


def _get_collection():
    from pymongo import MongoClient

    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DB]
    return client, db[MONGODB_COLLECTION]


def upsert_policy(output: dict) -> str:
    """
    Insert or update a policy document in MongoDB.

    Uses (payer_name + policy_id + source_file) as the upsert key so
    re-running the pipeline on the same PDF updates the existing record
    instead of creating a duplicate.

    Returns the inserted/upserted document _id as a string.
    """
    metadata = output.get("metadata", {})
    filter_key = {
        "metadata.source_file": metadata.get("source_file", ""),
        "metadata.payer_name": metadata.get("payer_name"),
        "metadata.policy_id": metadata.get("policy_id"),
    }

    document = {
        **output,
        "_inserted_at": datetime.now(timezone.utc).isoformat(),
    }

    client, collection = _get_collection()
    try:
        result = collection.replace_one(filter_key, document, upsert=True)
        if result.upserted_id is not None:
            return str(result.upserted_id)
        # Updated existing — fetch the _id
        existing = collection.find_one(filter_key, {"_id": 1})
        return str(existing["_id"]) if existing else ""
    finally:
        client.close()


def insert_policy(output: dict) -> str:
    """
    Always insert a new document (no deduplication).
    Returns the inserted _id as a string.
    """
    document = {
        **output,
        "_inserted_at": datetime.now(timezone.utc).isoformat(),
    }
    client, collection = _get_collection()
    try:
        result = collection.insert_one(document)
        return str(result.inserted_id)
    finally:
        client.close()
