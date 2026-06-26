# ValorAr

Aplicación web para consultar indicadores financieros de Argentina con gráficos interactivos. Centraliza cotizaciones del dólar, evolución de la inflación, tasas de plazo fijo y rendimientos APY por entidad, con datos obtenidos de APIs públicas.

**Demo:** [valorar.netlify.app](https://valorar.netlify.app/) · [![CI](https://github.com/DevEzequiel14/ValorAr/actions/workflows/ci.yml/badge.svg)](https://github.com/DevEzequiel14/ValorAr/actions/workflows/ci.yml)

## Objetivo

Ofrecer una interfaz clara y responsive para explorar información económica relevante del día a día en Argentina, sin registro ni backend propio. El foco está en la visualización de datos y una experiencia de navegación simple entre secciones.

## Stack

| Tecnología | Uso |
|---|---|
| **Angular 17** | Framework SPA con componentes standalone |
| **TypeScript** | Tipado estático y modelos de dominio |
| **RxJS** | Consumo reactivo de APIs con `HttpClient` |
| **Chart.js** | Gráficos de barras y líneas |
| **ng2-charts** | Integración de Chart.js con Angular |
| **SCSS** | Estilos con variables y mixins compartidos |
| **Playwright** | Tests end-to-end del flujo principal |

## APIs consumidas

| Fuente | Endpoint | Sección |
|---|---|---|
| [dolarapi.com](https://dolarapi.com) | `GET https://dolarapi.com/v1/dolares` | Dólares |
| [argentinadatos.com](https://argentinadatos.com) | `GET https://api.argentinadatos.com/v1/finanzas/indices/inflacion` | Inflación |
| [argentinadatos.com](https://argentinadatos.com) | `GET https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo` | Plazo fijo |
| [argentinadatos.com](https://argentinadatos.com) | `GET https://api.argentinadatos.com/v1/finanzas/rendimientos` | Rendimientos |

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Home con acceso rápido a cada sección |
| `/dollars` | Cotizaciones de compra y venta por casa de cambio |
| `/inflation` | Índice de inflación mensual (filtro por año) |
| `/plazo-fijo` | TNA por entidad financiera |
| `/performance` | Rendimientos APY por entidad y moneda |
| `/TNA` | Redirección permanente a `/plazo-fijo` |

## Capturas

![ValorAr — vista principal](https://github.com/user-attachments/assets/3f5e782d-86cc-4e7b-ba5a-274fe69dba67)

## Instalación

```bash
git clone https://github.com/DevEzequiel14/ValorAr.git
cd ValorAr
npm install
npm start
```

La app queda disponible en `http://localhost:4200/`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo (`ng serve`) |
| `npm run build` | Build de producción en `dist/valor-ar` |
| `npm test` | Tests unitarios con Karma/Jasmine (modo watch) |
| `npm run test:ci` | Tests unitarios headless con coverage (`ChromeHeadless`) |
| `npm run e2e` | Tests end-to-end con Playwright (levanta `ng serve` en el puerto 4201) |
| `npm run e2e:ci` | Igual que `e2e`, usado en CI con `CI=true` (GitHub Actions) |
| `npm run lint` | Análisis estático con ESLint |
| `npm run format:check` | Verificación de formato con Prettier |

## Deploy en Netlify

La configuración de build está documentada en [`netlify.toml`](netlify.toml) en la raíz del repositorio:

- **Build command:** `npm run build`
- **Publish directory:** `dist/valor-ar`
- **Node.js:** 20 (`NODE_VERSION`, con `NETLIFY_USE_NPM` para usar npm)

Netlify detecta ese archivo automáticamente al conectar el repo; no hace falta repetir esos valores en el panel.

Para el enrutamiento SPA y compatibilidad con URLs antiguas, `src/_redirects` se incluye como asset en `angular.json` y se copia al build (no se duplica en `netlify.toml`):

```
/TNA    /plazo-fijo    301
/*      /index.html    200
```

- La regla `/*` redirige todas las rutas a `index.html` (status 200) para que Angular Router resuelva la navegación del lado del cliente.
- La regla `/TNA` mantiene enlaces legacy hacia la sección de plazo fijo.

## Decisiones técnicas

- **Arquitectura por capas:** `src/app/features/` (páginas por dominio), `src/app/core/` (layout, servicios, modelos, interceptors) y `src/app/shared/` (componentes y utilidades reutilizables).
- **Lazy loading:** cada feature se carga bajo demanda con `loadComponent`, reduciendo el bundle inicial.
- **Standalone components:** sin NgModules; cada componente declara sus propias dependencias.
- **Una ruta por feature:** cada indicador financiero tiene su propia ruta, componente, servicio y modelo.
- **OnPush en smart components:** detección de cambios optimizada en las pantallas que consumen APIs.
- **Signals (piloto):** estado de UI (`loading`, `error`, `isEmpty`) con signals en `features/dollars/`; el resto de features mantiene el patrón clásico con `markForCheck`.
- **Interceptor HTTP:** `http-error.interceptor` registra errores de red/5xx en desarrollo; los features siguen manejando mensajes de error en la UI.
- **Registro centralizado de Chart.js:** configuración y tema de gráficos compartidos en `src/app/shared/charts/`.
- **Manejo de estados de UI:** loading, error y datos vacíos con `StateMessageComponent`.
- **CI en GitHub Actions:** lint, Prettier (`format:check`), tests unitarios con coverage (`test:ci`), build de producción y E2E con Playwright (`e2e:ci`). Ver [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
- **Tests E2E:** flujo home → dólares → gráfico mockeado en [`e2e/dollars.spec.ts`](e2e/dollars.spec.ts) (Playwright + `playwright.config.ts`).

## Autor

**Ezequiel Chorolque**

- LinkedIn: [linkedin.com/in/chorolque-ezequiel](https://www.linkedin.com/in/chorolque-ezequiel/)
- Email: ezequielchorolque14@gmail.com

## Licencia

Proyecto de portfolio con fines educativos y demostrativos. Los datos provienen de APIs de terceros; consultar los términos de uso de [dolarapi.com](https://dolarapi.com) y [argentinadatos.com](https://argentinadatos.com).
