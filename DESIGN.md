---
name: ValorAr
description: Lectura clara de indicadores financieros argentinos en un solo lugar
colors:
  navy-deep: "#001c31"
  ink-black: "#000000"
  text-primary: "#e0e6ed"
  text-secondary: "#a1a9b4"
  cyan-signal: "#00b4d8"
  amber-signal: "#f77f00"
  surface: "#0d1b2a"
  surface-hover: "#162b40"
  border: "#233952"
  success: "#4caf50"
  error: "#f44336"
typography:
  display:
    fontFamily: "Expletus Sans, Trebuchet MS, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  masthead:
    fontFamily: "Expletus Sans, Trebuchet MS, sans-serif"
    fontSize: "clamp(2.25rem, 5.5vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Expletus Sans, Trebuchet MS, sans-serif"
    fontSize: "clamp(1.35rem, 2.5vw, 1.75rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Source Sans 3, Segoe UI, Helvetica Neue, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Source Sans 3, Segoe UI, Helvetica Neue, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.01em"
  label:
    fontFamily: "Source Sans 3, Segoe UI, Helvetica Neue, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.cyan-signal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  surface-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  pill:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.text-primary}"
    rounded: "999px"
    padding: "4px 10px"
---

# Design System: ValorAr

## Overview

**Creative North Star: "El parte del día"**

ValorAr se siente como un parte económico cotidiano: denso en datos, claro en jerarquía, sin teatro fintech. El visitante lee primero un número y una frase; el gráfico es el detalle. La interfaz es Operate-first: escaneable, honesta, en español argentino.

Rechaza glow neon agresivo, hubs de cards como mensaje principal, y claims de asesoramiento. La identidad visual es dark navy con señales cian y ámbar.

**Key Characteristics:**
- Briefing antes que galería de charts
- Masthead home: marca ValorAr a escala plena + sello “Parte del día” con fecha (regla cian)
- Dos familias tipográficas con roles fijos (display vs body)
- Superficies planas con borde sutil, sin depth decorativo
- Glosas educativas (blue, IPC, TNA, APY) junto a los datos

## Colors

Paleta oscura de lectura nocturna/desktop con dos acentos de señal (cian = dólar/primario; ámbar = tasas/inflación).

### Primary
- **Cyan signal** (#00b4d8): CTAs, links, KPI de blue, foco, charts primarios.

### Secondary
- **Amber signal** (#f77f00): IPC, TNA, acentos de comparación.

### Neutral
- **Navy deep / ink** (gradiente #001c31 → #000): fondo de página.
- **Surface** (#0d1b2a) y **hover** (#162b40): paneles y controles.
- **Text primary** (#e0e6ed) / **secondary** (#a1a9b4): lectura y meta.
- **Border** (#233952): contornos de paneles.

### Semantic
- **Success** (#4caf50) / **Error** (#f44336): estados, no decoración.

Charts leen `--color-accent-*` desde `:root` (alineados a estos tokens).

## Typography

**Display:** Expletus Sans — marca, títulos de sección, KPIs numéricos.  
**Body/UI:** Source Sans 3 — ledes, labels, nav, meta, charts.

Roles: masthead (solo marca home) → display → headline → title → body → label/meta. Medida de prosa ~45–65ch. En dark, `line-height` 1.6 y tracking leve en body. Números con `tabular-nums`.

## Layout

Contenedor máx. ~1100px. Ritmo 8/16/24. Home: briefing → strips → atajos. Features: héroe → toolbar (`select-search`) → chart. Inflación: KPI primario del año del gráfico; “Cruce del parte” como sub-bloque atenuado (IPC anualizado + TNA). Mobile: columna única; en home (<640px) masthead compacto, tagline oculto, KPIs en 3 cols densos (sin sub/tag), lede sin clamp, strips apretados (dólar: Blue+Brecha; plazo: TNA+anualizado) para acercar el veredicto al fold; en features KPIs a 2–3 cols desde 640px; hub 2/4 cols en tablet/desktop.

## Elevation & Depth

Plano / tonal. Separación por borde y fondo de superficie, no sombras multi-capa. Sin glow como sistema (solo inset sutil en íconos de strip si hace falta).

## Shapes

Radios `4 / 8 / 12`. Pills `999px` para chips y tags “referencia”. Controles con borde 1px `border`.

## Components

- **feature-hero / feature-kpi:** ancla de lectura; dólares eco de brecha; plazo fijo e inflación eco TNA vs IPC anualizado.
- **strip:** pregunta + pills + veredicto (cierre) + matiz + CTA texto.
- **home-masthead:** marca + “Parte del día” + fecha; regla cian bajo el bloque.
- **hub-link:** atajo tipográfico secundario (título + meta, sin botón primario).
- **state-message:** error (`role=alert`) / empty + Reintentar.
- **briefing-partial:** aviso de fuentes fallidas + reintento global; KPI con badge y reintento por fuente.
- **feature-meta (home):** frescura de fuentes (`Datos: blue … · IPC de …`), no la fecha del masthead.
- **select-search:** combobox con borde, sin halo.
- **chart:** Chart.js con tipografía body y acentos de token.

## Do's and Don'ts

**Do**
- Empezar por un KPI + frase en criollo.
- Explicar TNA/APY/IPC/blue en la misma vista.
- Mantener voseo y tono educativo.
- Priorizar blue / top 5 casas / top tasas / ARS cuando haya muchas series; el resto detrás de “Ver todas”.

**Don't**
- Prometer asesoramiento financiero.
- Dejar el chart como único contenido de la sección.
- Inventar tokens o glows “neon dashboard”.
- Mezclar otra familia display fuera de Expletus.
