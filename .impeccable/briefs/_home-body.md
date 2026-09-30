# Home — Interpretación del día

## Mode
Operate

## Audience & job
Reclutador (~90s) o persona en Argentina que necesita leer el panorama económico cotidiano sin fricción. Job: entender qué importa hoy y dos lecturas cruzadas; opcionalmente profundizar en una de las 4 secciones.

## Outcome
En el primer pantallazo: briefing (“Qué importa hoy”) + strips “¿Dólar o pesos?” y “¿Plazo fijo vs inflación?” + atajos a las 4 secciones. Copy educativo, no asesoramiento.

## Direction
Extiende el mundo visual existente (dark navy, acentos cian/naranja) con tono más claro y productivo (menos glow). Jerarquía: briefing > strips interpretativos > cards como atajos. CTAs accionables, no “Ver gráfico”.

## Memorable moment
Bloque “Qué importa hoy” con 1 frase + 2–3 números grandes (Blue venta, último IPC, mejor TNA clientes etiquetada como referencia entre entidades).

## Scope
In: home `/`, fachada que cruza APIs existentes, estados por bloque. Out: rediseño de marca total, login, backend, nuevas rutas obligatorias. Intocable: 4 secciones, sin auth, APIs públicas, footer/autor, navbar.

## Anti-goals
Veredictos binarios de inversión; cifras inventadas; paredes de series en el home.

## Approved composition
`.impeccable/mocks/home-comp-a-briefing-stack.png` (option A — briefing apilado; approved 2026-09-29).

## Direction contract

THESIS: El home es un diario económico de una pantalla — briefing y cruces primero, directorio de charts nunca. Rechaza el hub de 4 cards de igual peso como primer mensaje.

OWN-WORLD: Fondo dark navy/negro radial existente; acento cian primario y naranja secundario; tipografía legible y clara (system o workhorse UI, sin display ornamental); cards/strips con borde sutil, sin glow agresivo; números grandes como ancla; español argentino voseado.

STORY: El visitante entiende el momento económico en segundos, ve dos lecturas cruzadas honestas (educativas), y sabe adónde ir a profundizar. Sale con criterio de producto, no solo con “vi Chart.js”.

FIRST VIEWPORT: Encabezado breve (marca + ritual “Parte del día”) → bloque “Qué importa hoy” (frase + KPIs Blue / IPC / TNA referencia) → strip “¿Dólar o pesos?” → strip “¿Plazo fijo vs inflación?”. Mobile (<640px): masthead compacto, tagline oculto, KPIs en 3 cols densos (sin glosas) y strips apretados para acercar el primer veredicto al fold; disclaimer corto antes de atajos. Las 4 cards quedan debajo del fold o claramente secundarias. Acción primaria: leer; secundaria: links “Ver detalle” / CTAs de sección.

FORM: Extensión del home existente dentro del mundo en código; estructura fijada por shape confirmado 2026-09-29 (briefing → strips → atajos). Seed: shape-home-briefing (sin concept-seed; brief preciso).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
