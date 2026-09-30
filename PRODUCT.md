# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Audiencia del portfolio:** reclutadores y evaluadores técnicos que revisan el proyecto para ver criterio de producto y dominio frontend (Angular, RxJS, Chart.js, arquitectura por features).

**Usuario del producto:** persona en Argentina que necesita entender rápido el panorama económico cotidiano — dólar, inflación y opciones de ahorro — sin registrarse ni navegar varias fuentes.

## Product Purpose

ValorAr centraliza indicadores financieros de Argentina y ayuda a **interpretarlos juntos**, no solo a listarlos. El éxito es que alguien (o un reclutador probando la demo) entienda en poco tiempo qué está pasando y qué implica para una decisión cotidiana, con visualización clara y sin fricción.

La app existe como portfolio educativo y demostrativo: debe resolver un problema real de lectura económica argentina y, al hacerlo, evidenciar el stack y las decisiones de ingeniería.

## Positioning

Un solo lugar para dólar, inflación, plazo fijo y rendimientos, con lectura rápida y **cruce entre indicadores** — no paneles aislados ni un espejo de las APIs de origen.

El valor diferencial es la interpretación orientada a decisión:

1. **Qué importa hoy** — el home resume el dato clave del momento (contexto, no solo enlaces).
2. **¿Dólar o pesos?** — snapshot que combina blue, inflación y tasas hacia un veredicto simple.
3. **¿El plazo fijo le gana a la inflación?** — cruce de TNA/APY vs inflación reciente.

## Operating Context

- Uso puntual desde el navegador (mobile y desktop), sin cuenta.
- Datos en vivo desde APIs públicas de terceros (`dolarapi.com`, `argentinadatos.com`).
- Demo desplegada en Netlify: https://valorar.netlify.app/
- Evaluación típica de portfolio: abrir la demo, recorrer las 4 secciones y ver cómo se presentan y cruzan los datos.

## Capabilities and Constraints

**Confirmado hoy (implementado):**

- Secciones: Dólares, Inflación, Plazo fijo, Rendimientos (APY).
- Home con briefing “Qué importa hoy” (Blue, IPC, mejor TNA referencia), strips “¿Dólar o pesos?” / “¿Plazo fijo vs inflación?” y atajos a las 4 secciones.
- Gráficos interactivos (Chart.js / ng2-charts).
- Sin registro ni backend propio; solo consumo HTTP de APIs públicas.
- Español (`es` / `es_AR` en metadatos).
- Estados de UI: loading, error y vacío; fallas parciales del briefing visibles por fuente con reintento por bloque.
- Ruta legacy `/TNA` → `/plazo-fijo`.

**Dirección de producto (parcialmente en home; detalle en secciones en curso):**

- Home orientado a “qué importa hoy” — **hecho (v1)**.
- Ayuda a decidir “dólar o pesos” — strip en home + héroe en `/dollars` con eco de brecha + KPI blue/oficial/spread; chart top 5 casas y “Ver todas”.
- Ayuda a evaluar “plazo fijo vs inflación” — strip en home + eco TNA/IPC en `/plazo-fijo` e `/inflation`.
- Rendimientos cierran el parte — héroe con APY + eco TNA/IPC anualizado en `/performance` (cruce en ARS).

**No negociable:**

- Sin login / sin auth.
- Solo consumo de APIs públicas (sin backend propio).
- Foco en esas 4 secciones como núcleo.
- Carácter de portfolio educativo y demostrativo.
- No fabricar testimonios, clientes, benchmarks ni claims de precisión financiera profesional.

**Confirmado (lectura / veredictos en home):**

- Strips cierran con veredicto explícito + matiz: dólar/pesos (brecha blue–oficial + IPC) y plazo fijo vs inflación (TNA vs IPC anualizado compuesto).
- Tonos educativos; sin órdenes de compra ni asesoramiento.

**Confirmado (frescura en home y features):**

- Meta bajo el briefing: `Datos: blue <fecha-hora> · IPC de <mes año>` (distinto del sello calendario “Parte del día”).
- Inflación / Plazo fijo / Rendimientos / Dólares: `feature-meta` con prefijo `Datos:` (período IPC, cotizaciones con hora, honestidad cuando TNA/APY no exponen timestamp).
- Lede de “Qué importa hoy” ecoa los veredictos de los strips (no enumera KPIs).

## Brand Commitments

- Nombre: **ValorAr**.
- Tagline actual en producto: “Información Financiera”.
- Autor visible: Ezequiel Chorolque (crédito en footer / README).
- Tono: claro, directo, en español argentino; útil sin pretender asesoramiento financiero formal.
- Identidad visual vinculada a la app existente (assets en `src/assets/`); no se redefine en este archivo.

## Evidence on Hand

- Demo pública: https://valorar.netlify.app/
- Captura de portfolio: `src/assets/img/ValorAr.webp`
- Íconos y assets de sección en `src/assets/`
- README con stack, rutas, APIs y decisiones técnicas
- No hay testimonios de usuarios, case studies de clientes ni métricas de adopción reales; trabajo futuro no debe inventarlos.

## Product Principles

1. **Interpretar, no solo mostrar** — cada superficie acerca al usuario a una lectura útil del momento o a una decisión cotidiana.
2. **Un solo lugar, fricción cero** — sin cuenta, sin setup; datos públicos y navegación simple entre las 4 secciones.
3. **Rapidez de lectura** — la información importante se entiende en segundos; el detalle gráfico es apoyo, no el único mensaje.
4. **Portfolio con problema real** — la demo debe demostrar oficio técnico resolviendo un caso argentino concreto, no solo listar tecnologías.
5. **Honestidad de alcance** — portfolio educativo; fuentes de terceros; sin promesas de asesoramiento financiero.

## Accessibility & Inclusion

Español como idioma de producto. No hay un estándar de accesibilidad formal fijado aún (p. ej. WCAG); el trabajo futuro debe preservar navegación usable en mobile y desktop y no degradar labels/`aria` ya presentes en el layout.
