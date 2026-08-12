# Sillage Lab

Sillage Lab is a creative perfumery workspace for developing, storing, and safety-reviewing fragrance formulas with AI coaching.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/sillage-lab` — the user-facing React + Vite workspace and branded auth screens.
- `artifacts/api-server/src/routes` — formula, material, dashboard, and AI coaching routes.
- `lib/api-spec/openapi.yaml` — source of truth for the typed API contract.
- `lib/db/src/schema` — Drizzle schema for owned formulas and shared raw materials.
- `artifacts/sillage-lab/src/index.css` — Sillage Lab visual theme and typography tokens.

## Architecture decisions

- Formula records are scoped to the authenticated Clerk user via `ownerId`; raw materials are shared reference data.
- Formula safety is computed server-side from the current material catalog, including allergen presence and IFRA percentage checks.
- AI coaching uses Replit-managed OpenAI access and returns structured reply, suggestions, and cautions.

## Product

Perfumers can create and revise formulas, search their formula library, browse materials with allergen and IFRA context, review safety status, and ask an AI coach for more original directions.

## User preferences

- Keep the product personal and creative without weakening safety language or encouraging users to treat AI as a replacement for current IFRA documentation.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- Formula and material APIs require a Clerk session; the public root route remains accessible to signed-out visitors.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
