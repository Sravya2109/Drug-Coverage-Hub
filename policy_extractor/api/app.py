from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from policy_extractor.api.routes.extraction import router as extraction_router
from policy_extractor.api.routes.search import router as search_router
from policy_extractor.config import get_config


def create_app() -> FastAPI:
    config = get_config()

    app = FastAPI(
        title="Drug Coverage Hub — Policy Extraction API",
        description="Converts medical policy PDFs into structured JSON coverage data",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(extraction_router, prefix="/api/v1")
    app.include_router(search_router, prefix="/api/v1")

    @app.on_event("startup")
    async def startup() -> None:
        if not config.anthropic_api_key:
            import logging
            logging.warning(
                "ANTHROPIC_API_KEY is not set. LLM extraction will fail. "
                "Set the environment variable before processing documents."
            )
        else:
            print(f"[startup] API ready. Model: {config.claude_model}")

    return app


app = create_app()
