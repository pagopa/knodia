# Knodia Monorepo

## Setup

```bash
pnpm install
```

## Development

```bash
# Start all backend services (infra starts automatically)
pnpm dev:services

# Start specific services
pnpm --filter @knodia/eservice-process --filter @knodia/k2k-gateway dev
```

See root `package.json` for other available scripts.

## Testing

All tests share a global Testcontainers setup — always use `pnpm test`, never `pnpm --filter`.

```bash
pnpm test                                          # all
pnpm test --project @knodia/eservice-process       # one package
pnpm test --project @knodia/eservice-process --project @knodia/agreement-process  # multiple
pnpm test:watch --project @knodia/eservice-process # watch mode
```

## Multinode

Two-knode local setup (Orion + Lynx) for cross-node flows.

```bash
pnpm multinode:start
pnpm multinode:stop
pnpm multinode:destroy
```
