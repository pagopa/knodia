# Knodia Monorepo

## Setup

```bash
pnpm install
```

## Development

```bash
# Start all local dev services (infra starts automatically)
pnpm start:services

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

## Licensing

This project is licensed under the terms of the **European Union Public Licence version 1.2 (EUPL-1.2)**.
The full text of the license can be found in the [LICENSE](LICENSE) file.
Please see the [AUTHORS](AUTHORS) file for the copyright notice.

### Trademarks and logos

The project name, official logos, branding assets, and trademarks contained in this repository (specifically in the `apps/web/signup-frontend/src/assets` directory) are NOT covered by the European Union Public Licence version 1.2 (EUPL-1.2). All rights, title, and interest in them remain the exclusive property of their respective owners.
