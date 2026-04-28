# casa

## Prerequisites

- [pnpm](https://pnpm.io/) must be available locally.

## Local dev quickstart

Run the worker locally using Wrangler via pnpm:

```sh
pnpm install
pnpm run dev
```

Then test locally:

- `http://localhost:8787/`

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (with [pnpm](https://pnpm.io/))
- **Compute**: [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) (TypeScript)

```sh
# initial code generated with:
pnpm create cloudflare@latest durable-object-starter
```

## Deploy

Deploy to Cloudflare:

```sh
pnpm run deploy
```
