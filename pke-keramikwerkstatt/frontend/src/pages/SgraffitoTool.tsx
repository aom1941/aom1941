export function SgraffitoTool() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏺 sGraffito-Vorlage</h1>
          <p>Foto → Geometrie → Fliese. Läuft komplett im Browser, offline-fähig — Einstellungen bleiben lokal erhalten.</p>
        </div>
      </div>

      <iframe
        src="/tools/sgraffito.html"
        title="sGraffito-Vorlage"
        className="tool-frame"
      />
    </div>
  )
}
