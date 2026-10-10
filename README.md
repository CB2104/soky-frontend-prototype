# SOKY Frontend

Frontend de SOKY, una experiencia web para explorar el menú, revisar promociones, gestionar el carrito y continuar pedidos por WhatsApp.

El proyecto está construido con Next.js App Router y funciona por defecto con una API mock local. También puede conectarse a una API real mediante variables de entorno.

## Funcionalidades

- Home pública con promociones, productos destacados y ubicación.
- Menú con categorías y páginas de detalle de producto.
- Carrito persistente y flujo de confirmación de pedido.
- Integración de pedidos por WhatsApp.
- Navegación responsive con drawers para menú y carrito.
- FAQ y rutas de confirmación de pedidos.
- API mock local para desarrollo frontend independiente.
- Panel administrativo en desarrollo bajo una ruta configurable.

## Stack

- Next.js 16 con App Router.
- React 19.
- TypeScript strict.
- Tailwind CSS 4.
- Zustand para estado del carrito.
- Motion y GSAP para animaciones.
- ESLint 9.

## Requisitos

- Node.js compatible con Next.js 16.
- pnpm.

## Instalación

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

El modo mock funciona con los valores predeterminados. Para personalizar la configuración, crea un archivo `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_MODE=mock
NEXT_PUBLIC_API_BASE_URL=/api/mock/v1
NEXT_PUBLIC_ADMIN_PATH=admin-secret
```

| Variable | Descripción | Valor predeterminado |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública usada por metadata y solicitudes del servidor. | `http://localhost:3000` |
| `NEXT_PUBLIC_API_MODE` | Selecciona la API: `mock` o `real`. | `mock` |
| `NEXT_PUBLIC_API_BASE_URL` | Base de la API mock local. | `/api/mock/v1` |
| `NEXT_PUBLIC_REAL_API_BASE_URL` | Base del backend cuando el modo es `real`. | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_ADMIN_PATH` | Segmento configurable de la ruta administrativa. | `admin-secret` |

`NEXT_PUBLIC_ADMIN_PATH` no es un mecanismo de seguridad. El acceso administrativo debe protegerse con autenticación y autorización en el backend.

Para conectarte a una API real:

```env
NEXT_PUBLIC_API_MODE=real
NEXT_PUBLIC_REAL_API_BASE_URL=http://localhost:4000/api/v1
```

## Scripts

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Inicia el servidor de desarrollo. |
| `pnpm build` | Genera el build de producción. |
| `pnpm start` | Ejecuta el build de producción. |
| `pnpm lint` | Ejecuta ESLint. |

## Rutas principales

| Ruta | Propósito |
| --- | --- |
| `/` | Home pública. |
| `/menu` | Menú completo. |
| `/menu/[slug]` | Detalle de producto. |
| `/faq` | Preguntas frecuentes. |
| `/cart` | Carrito y datos del pedido. |
| `/order-intents/confirm/[token]` | Confirmación de una intención de pedido. |
| `/${NEXT_PUBLIC_ADMIN_PATH}` | Entrada al panel administrativo. |

## Estructura principal actual

```text
src/
├── app/          # Rutas, layouts y endpoints mock
├── components/   # Componentes compartidos de UI y layout
├── contracts/    # Contratos TypeScript de la API
├── features/     # Dominios como carrito, productos y settings
├── lib/          # Configuración y utilidades compartidas
└── mock/         # Datos y helpers de la API mock
```

La [convención canónica de organización frontend](docs/fullstack/01_FRONTEND_ARCHITECTURE_SPLIT.md)
define la estructura objetivo y debe consultarse antes de crear componentes o
funcionalidades. Fue aprobada el 27 de septiembre de 2026; **la migración de
código sigue pendiente**. Incluye secciones de inicio en `features/home/sections`,
separación de BrandStrip y Hero y agrupación gradual de carrito, admin, layout y
providers, sin cambiar rutas públicas.

Consultar [el índice operativo](docs/README.md), [el backlog](docs/fullstack/05_FRONTEND_BACKLOG_CODEX.md),
el [registro de deuda técnica](docs/TECHNICAL_DEBT.md) y [la guía de agentes](AGENTS.md)
para continuar el trabajo.

## Estado

Proyecto frontend en desarrollo activo. El modo mock permite trabajar sin backend; para producción deben configurarse la API real, autenticación administrativa y los datos definitivos del negocio.
