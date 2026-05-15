# casa

A small household management webapp. Currently features a freezer inventory tracker.

## Stack

| Layer | Technology |
| --- | --- |
| Compute | [Cloudflare Workers](https://developers.cloudflare.com/workers/) + [Durable Objects](https://developers.cloudflare.com/durable-objects/) |
| Storage | Durable Object SQLite |
| Frontend | [htmx](https://htmx.org/), [DaisyUI](https://daisyui.com/), [Tailwind CSS](https://tailwindcss.com/) (browser build) |
| Language | TypeScript |
| Package manager | [pnpm](https://pnpm.io/) |

## Architecture

A single `CasaDurableObject` instance (named `"casa"`) owns all state. The Worker
routes HTTP requests to it via RPC. All HTML is server-rendered from `.html`
template strings imported as modules.

Migrations run automatically on startup via `runMigrations()` in `src/db.ts`.

Access is restricted to requests originating from countries in an allowlist (`CF-IPCountry`).

## Prerequisites

- [pnpm](https://pnpm.io/)
- A Cloudflare account with Workers and Durable Objects enabled
- [prek](https://github.com/j178/prek)

## Local development

```sh
pnpm install
pnpm run dev  # wrangler dev, serves on http://localhost:8787
```

## Useful commands

```sh
pnpm run dev
pnpm run typecheck   # tsc --noEmit
pnpm run cf-typegen  # regenerate worker-configuration.d.ts after wrangler.jsonc changes
pnpm run deploy      # wrangler deploy
```

## Static assets

Static assets live in `public/` which is ignored by git. To commit assets:

```sh
zip -r -e public.zip public/

unzip public.zip
```

## Deploy

The following must be set as Cloudflare secrets before deploying:

```sh
# HOME_ADDRESS - property name to show in the header
wrangler secret put HOME_ADDRESS

# ALLOWED_COUNTRIES - comma-separated ISO 3166-1 alpha-2 country codes
wrangler secret put ALLOWED_COUNTRIES
```

```sh
# Deploy the Durable Object to Cloudflare
unzip public.zip && pnpm run deploy
```

## Linting & formatting

```sh
prek install          # set up hooks
prek run --all-files  # run manually
```
