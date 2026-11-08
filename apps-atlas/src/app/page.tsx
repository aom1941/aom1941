"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppRecord, LayerRecord } from "@/lib/catalog";

type CatalogResponse = {
  stats: {
    total: number;
    dbYes: number;
    dbMaybe: number;
    dbNo: number;
    viewer: string;
  };
  layers: LayerRecord[];
  apps: AppRecord[];
};

type DbFilter = "all" | "yes" | "maybe" | "no";

export default function HomePage() {
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DbFilter>("all");

  useEffect(() => {
    let cancelled = false;
    const query = filter === "all" ? "" : `?db=${filter}`;
    fetch(`/api/catalog${query}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Katalog laden fehlgeschlagen (${res.status})`);
        }
        return res.json() as Promise<CatalogResponse>;
      })
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unbekannter Fehler");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const grouped = useMemo(() => {
    if (!data) return [];
    const order = data.layers.map((layer) => layer.id);
    return order
      .map((layerId) => ({
        layer: data.layers.find((layer) => layer.id === layerId)!,
        apps: data.apps.filter((app) => app.layer === layerId),
      }))
      .filter((group) => group.apps.length > 0);
  }, [data]);

  return (
    <main>
      <section className="hero">
        <h1>Apps Atlas</h1>
        <p>
          Übersicht der Workspace-Apps, ihrer Fähigkeiten und des
          apps-database-Bedarfs — plus die kompakte Zielstruktur in fünf
          Schichten.
        </p>
      </section>

      {error ? <div className="error">{error}</div> : null}
      {!data && !error ? <div className="loading">Katalog wird geladen…</div> : null}

      {data ? (
        <>
          <section className="stats" aria-label="Kennzahlen">
            <div className="stat">
              <strong>{data.stats.total}</strong>
              <span>Einträge</span>
            </div>
            <div className="stat">
              <strong>{data.stats.dbYes}</strong>
              <span>DB nötig</span>
            </div>
            <div className="stat">
              <strong>{data.stats.dbMaybe}</strong>
              <span>DB optional</span>
            </div>
            <div className="stat">
              <strong>{data.stats.dbNo}</strong>
              <span>ohne App-DB</span>
            </div>
          </section>

          <section className="layers" aria-label="Zielstruktur">
            {data.layers.map((layer) => (
              <article key={layer.id} className="layer">
                <h3>{layer.title}</h3>
                <p>
                  <strong>{layer.role}</strong>
                  <br />
                  {layer.contents}
                </p>
              </article>
            ))}
          </section>

          <div className="toolbar" role="tablist" aria-label="DB-Filter">
            {(
              [
                ["all", "Alle"],
                ["yes", "DB nötig"],
                ["maybe", "DB optional"],
                ["no", "ohne DB"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                data-active={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {grouped.map(({ layer, apps }) => (
            <section key={layer.id} style={{ marginBottom: "1.5rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.25rem",
                  margin: "0 0 0.75rem",
                }}
              >
                {layer.title} — {layer.role}
              </h2>
              <div className="grid">
                {apps.map((app) => (
                  <article key={app.id} className="card">
                    <div className="card-head">
                      <h2>{app.name}</h2>
                      <span className={`pill ${app.db_need}`}>
                        db: {app.db_need}
                      </span>
                    </div>
                    <div className="meta">
                      <span className="pill">{app.kind}</span>
                      <span className="pill">{app.maturity}</span>
                      <span className="pill">{app.layer}</span>
                    </div>
                    <p>{app.zweck}</p>
                    <dl>
                      <div>
                        <dt>Fähigkeiten</dt>
                        <dd>{app.capabilities}</dd>
                      </div>
                      <div>
                        <dt>Storage heute</dt>
                        <dd>{app.storage_today}</dd>
                      </div>
                      <div>
                        <dt>Pfad</dt>
                        <dd>
                          <code>{app.path}</code>
                        </dd>
                      </div>
                    </dl>
                    {app.github_url ? (
                      <a href={app.github_url} target="_blank" rel="noreferrer">
                        GitHub
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>App</th>
                  <th>Layer</th>
                  <th>Storage</th>
                  <th>DB</th>
                </tr>
              </thead>
              <tbody>
                {data.apps.map((app) => (
                  <tr key={`row-${app.id}`}>
                    <td>{app.name}</td>
                    <td>{app.layer}</td>
                    <td>{app.storage_today}</td>
                    <td>{app.db_need}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="footer">
            Viewer: {data.stats.viewer} · Sample-Katalog in Postgres/PGlite ·
            Regel: App-DB nur bei Daten, die Sessions/Geräte/User überdauern.
          </p>
        </>
      ) : null}
    </main>
  );
}
