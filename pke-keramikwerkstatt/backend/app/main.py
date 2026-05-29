import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .catalog import BLUEPRINT
from .database import Base, engine
from .routers import dashboard, kurse, teilnehmer


def parse_allowed_origins() -> list[str]:
    raw_value = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:8080,http://127.0.0.1:5173,http://127.0.0.1:8080",
    )
    return [origin.strip() for origin in raw_value.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Keramikwerkstatt API",
    version="0.1.0",
    summary="MVP-API für Werkstattorganisation, Brennplanung, Kurse und Dokumente.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
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


app.include_router(dashboard.router)
app.include_router(kurse.router)
app.include_router(teilnehmer.router)
