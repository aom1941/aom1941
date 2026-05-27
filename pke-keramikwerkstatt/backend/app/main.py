import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .catalog import BLUEPRINT


def parse_allowed_origins() -> list[str]:
    raw_value = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:8080,http://127.0.0.1:5173,http://127.0.0.1:8080",
    )
    return [origin.strip() for origin in raw_value.split(",") if origin.strip()]


app = FastAPI(
    title="Keramikwerkstatt API",
    version="0.1.0",
    summary="MVP-API für Werkstattorganisation, Brennplanung, Kurse und Dokumente.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/blueprint")
def get_blueprint():
    return BLUEPRINT.model_dump()


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "keramikwerkstatt-api",
        "docs": "/docs",
        "blueprint": "/api/blueprint",
    }
