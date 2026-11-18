# 🏺 pke-sgraffito — Foto → Fliese

> Ein-Datei-Werkzeug, das Fotos (Architektur, Silhouetten, Diagonalen) in zwei-
> oder dreifarbige **sGraffito-Vorlagen** für engobierte Tonfliesen verwandelt:
> Foto → Geometrie-Extraktion → SVG → Tonvorlage 1:1.

**Stand:** Das Werkzeug ist seit dem 18.11.2026 Teil des Werkstattboards im
privaten Repository `pilzkeramik/pke-keramikwerkstatt` und wird nur dort
gepflegt. Die Fassung, die hier lag, bleibt in der Git-Historie dieses Repos
nachlesbar.

## Was es kann

- Zwei Töne (eine Engobe) oder drei Töne (zweischichtige Engobe), Schwellen
  per Otsu bzw. Multi-Otsu
- Fliesenmaß und Raster für Mehrfliesen-Motive mit Fugenbreite
- Druck 1:1 in mm, gespiegelt für den Durchpaus-Transfer, eine Seite je Fliese
- Export als SVG und als PNG mit Foto und Linien
- Farbübernahme per Pipette aus einem Referenzfoto
- Läuft offline im Browser, ohne Abhängigkeiten

## Technik

Vanilla JS: Graustufen → Boxblur → Schwellwert → Marching Squares →
Ramer–Douglas–Peucker → SVG mit `fill-rule="evenodd"`, Druckmaß über
`mm`-Einheiten.
