#!/usr/bin/env python3
"""
RAG-Indexer (PostgreSQL/pgvector): Paperless-ngx Dokumente → PostgreSQL Embedding

Holt neue/geänderte Dokumente aus Paperless-ngx via API,
erzeugt Embeddings über Ollama und speichert sie in PostgreSQL
(pgvector-Erweiterung) für spätere RAG-Abfragen (z.B. durch den Buchhaltungsbot).

Vorteile gegenüber ChromaDB-Variante:
  - Nutzt die bereits vorhandene Paperless-PostgreSQL-Instanz
  - pgvector: natives Vektor-ähnlichkeitssuche in SQL (cosine, L2, inner product)
  - ACID-Transaktionen, volle SQL-Abfragen auf Metadaten möglich
  - Kein zusätzlicher ChromaDB-Service notwendig

Voraussetzungen:
  pip install requests psycopg2-binary pgvector

Umgebungsvariablen:
  PAPERLESS_URL        Paperless-ngx URL          (default: http://localhost:8000)
  PAPERLESS_TOKEN      Paperless API-Token
  OLLAMA_URL           Ollama URL                  (default: http://localhost:11434)
  OLLAMA_EMBED_MODEL   Embedding-Modell            (default: nomic-embed-text)
  PG_HOST              PostgreSQL Host             (default: localhost)
  PG_PORT              PostgreSQL Port             (default: 5432)
  PG_DB                PostgreSQL Datenbank        (default: paperless)
  PG_USER              PostgreSQL Benutzer         (default: paperless)
  PG_PASS              PostgreSQL Passwort         (default: paperless)
  PG_TABLE             Tabelle für RAG-Dokumente   (default: aom_rag_documents)

HRFR-v2 · sys-Domain · Stand 2025
"""

import hashlib
import os
import sys
from datetime import datetime
from urllib.parse import urlparse, urlunparse

PAPERLESS_URL = os.getenv("PAPERLESS_URL", "http://localhost:8000")
PAPERLESS_TOKEN = os.getenv("PAPERLESS_TOKEN", "")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB = os.getenv("PG_DB", "paperless")
PG_USER = os.getenv("PG_USER", "paperless")
PG_PASS = os.getenv("PG_PASS", "paperless")
PG_TABLE = os.getenv("PG_TABLE", "aom_rag_documents")

# Ollama-Kontextfenster: nomic-embed-text verarbeitet ~8 192 Token ≈ ~32 000 Zeichen.
# 4 000 Zeichen ist ein konservativer, modellunabhängiger Grenzwert.
MAX_EMBEDDING_CONTENT_LENGTH = 4000
# Gespeicherter Volltextausschnitt im Index (für Vorschau/Snippet-Anzeige).
# Kürzer als Embedding-Input, da nur für Lesbarkeit, nicht für Vektorberechnung.
MAX_STORED_CONTENT_LENGTH = 2000


def _resolve_ollama(url: str):
    """OLLAMA Basic Auth aus URL extrahieren (http://user:pass@host:port/path)."""
    parsed = urlparse(url)
    auth = None
    if parsed.username:
        from requests.auth import HTTPBasicAuth
        auth = HTTPBasicAuth(parsed.username, parsed.password or "")
    host_part = (parsed.hostname or "")
    if parsed.port:
        host_part += f":{parsed.port}"
    clean = urlunparse((
        parsed.scheme,
        host_part,
        parsed.path,
        parsed.params,
        parsed.query,
        parsed.fragment,
    ))
    return clean, auth


def _ensure_schema(cur, table: str) -> None:
    """pgvector-Erweiterung und RAG-Tabelle anlegen (idempotent)."""
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {table} (
            doc_id        TEXT PRIMARY KEY,
            title         TEXT,
            correspondent TEXT,
            created       TEXT,
            content       TEXT,
            content_hash  TEXT,
            embedding     vector(768),
            indexed_at    TEXT
        );
    """)
    cur.execute(f"""
        CREATE INDEX IF NOT EXISTS {table}_embedding_idx
        ON {table} USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    """)


def main() -> None:
    try:
        import psycopg2
        import requests
        from pgvector.psycopg2 import register_vector
    except ImportError:
        print("Bitte installieren: pip install requests psycopg2-binary pgvector")
        sys.exit(1)

    # PostgreSQL verbinden
    conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        dbname=PG_DB,
        user=PG_USER,
        password=PG_PASS,
    )
    register_vector(conn)
    cur = conn.cursor()

    _ensure_schema(cur, PG_TABLE)
    conn.commit()

    # Ollama-URL vorbereiten
    ollama_url_clean, ollama_auth = _resolve_ollama(OLLAMA_URL)

    # Paperless-ngx Dokumente abrufen (alle Seiten)
    headers = {}
    if PAPERLESS_TOKEN:
        headers["Authorization"] = f"Token {PAPERLESS_TOKEN}"

    page_url: str | None = f"{PAPERLESS_URL}/api/documents/"
    documents: list = []
    while page_url:
        resp = requests.get(page_url, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        documents.extend(data.get("results", []))
        page_url = data.get("next")

    indexed = 0
    skipped = 0
    for doc in documents:
        doc_id = str(doc["id"])
        content = doc.get("content", "") or ""
        if not content.strip():
            skipped += 1
            continue

        # Hash-Vergleich: bereits aktuell?
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        cur.execute(
            f"SELECT content_hash FROM {PG_TABLE} WHERE doc_id = %s",
            (doc_id,),
        )
        row = cur.fetchone()
        if row and row[0] == content_hash:
            skipped += 1
            continue

        # Embedding via Ollama
        try:
            embed_resp = requests.post(
                f"{ollama_url_clean}/api/embeddings",
                json={"model": OLLAMA_MODEL, "prompt": content[:MAX_EMBEDDING_CONTENT_LENGTH]},
                auth=ollama_auth,
                timeout=60,
            )
            embed_resp.raise_for_status()
            embedding = embed_resp.json().get("embedding", [])
        except (requests.RequestException, ValueError) as exc:
            print(f"  ⚠ Embedding-Fehler für Dokument {doc_id}: {exc}")
            continue

        if not embedding:
            print(f"  Kein Embedding für Dokument {doc_id}, überspringe")
            skipped += 1
            continue

        # In PostgreSQL speichern (upsert)
        cur.execute(
            f"""
            INSERT INTO {PG_TABLE}
                (doc_id, title, correspondent, created, content,
                 content_hash, embedding, indexed_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (doc_id) DO UPDATE SET
                title         = EXCLUDED.title,
                correspondent = EXCLUDED.correspondent,
                created       = EXCLUDED.created,
                content       = EXCLUDED.content,
                content_hash  = EXCLUDED.content_hash,
                embedding     = EXCLUDED.embedding,
                indexed_at    = EXCLUDED.indexed_at;
            """,
            (
                doc_id,
                doc.get("title", ""),
                str(doc.get("correspondent") or ""),
                doc.get("created", ""),
                content[:MAX_STORED_CONTENT_LENGTH],
                content_hash,
                embedding,
                datetime.now().isoformat(),
            ),
        )
        conn.commit()
        indexed += 1
        print(f"  ✓ Dokument {doc_id}: {doc.get('title', '?')}")

    cur.close()
    conn.close()
    print(
        f"\n{indexed} Dokument(e) indexiert, {skipped} übersprungen"
        f" → Tabelle '{PG_TABLE}' (PostgreSQL/pgvector)"
    )


if __name__ == "__main__":
    main()
