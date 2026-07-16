# 🏺 pke-sgraffito — Foto → Fliese

Ein-Datei-Werkzeug, das Fotos (Architektur, Silhouetten, Diagonalen) in
zweifarbige **sGraffito-Vorlagen** für engobierte Tonfliesen verwandelt.

Umsetzung der Skizze: **Foto → Geometrie-Extraktion → SVG → { Tonvorlage 1:1 · Homepage/Print }**

## Benutzen

`index.html` im Browser öffnen — fertig. Keine Installation, kein Server,
keine Abhängigkeiten; läuft offline, auch auf dem iPad im Atelier.

```
open pke-sgraffito/index.html
```

1. **Foto reinziehen** — gut funktionieren klare Silhouetten gegen Himmel
   (Schornstein, Betonkanten, Balkonraster).
2. **Geometrie-Regler:** Schwelle trennt hell/dunkel (Otsu-Auto-Knopf),
   *Vereinfachung* macht aus Pixelkonturen ruhige Polygone,
   *Kleinteile entfernen* wirft Rauschen raus.
   - **Zwei Töne** — eine Engobe: dunkel = Engobe bleibt, hell = Ton freigekratzt.
   - **Drei Töne** — zweischichtige Engobe: zwei Schwellen (Auto via
     Multi-Otsu). Dunkel = obere Engobe bleibt, Mittelton = Stufe 1
     (nur obere Schicht abgetragen, untere Engobe sichtbar), hell =
     Stufe 2 (bis auf den Ton). Im Linien-Druck ist die Grenze zur
     tiefsten Stufe gestrichelt.
3. **Fliese:** Maß wählen (10×10 / 15×15 / 20×20 oder frei), Ausschnitt
   und Zoom schieben.
4. **Export:**
   - 🖨️ **Drucken 1:1** — maßhaltige Vorlage direkt aus dem Browser
     (mm-genau, mit Beschriftung; *Spiegeln* für Durchpaus-Transfer)
   - **SVG** — für Archiv, Plotter oder Weiterbearbeitung
   - **PNG Foto+Linien** — Overlay-Bild für Homepage / Druckwerk

## Technik (für Neugierige)

Vanilla JS, keine Libraries:
Graustufen → Boxblur → Schwellwert (Otsu, bei drei Tönen
Zwei-Schwellen-Otsu) → Marching Squares (Konturen inkl. Löcher,
eine Ebene pro Schwelle) → Ramer–Douglas–Peucker-Vereinfachung →
SVG mit `fill-rule="evenodd"`. Druckmaß über `mm`-Einheiten im SVG.

## Ablauf im Atelier

1. Tonplatte ausrollen (8–10 mm), auf Maß, lederhart anziehen lassen
2. 2–3 dünne Engobe-Schichten, jeweils kurz anziehen lassen
3. Vorlage 1:1 drucken (ggf. gespiegelt)
4. Konturen mit Kugelschreiber/stumpfer Nadel durchdrücken
   (oder Lochpause + Pigmentbeutel)
5. sGraffito: „Ton“-Flächen mit Schlingschleife freilegen —
   große Flächen zuerst, feine Linien zuletzt, Kanten leicht anschrägen
6. Langsam trocknen → Schrühbrand → optional Transparentglasur → Glasurbrand

Die Hilfe dazu steckt auch ausklappbar direkt im Tool.
