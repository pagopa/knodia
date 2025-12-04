# Knodia

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PNPM >= 9.0.0

### Installation

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

## Project Structure
```
.
├── packages/             # Shared packages
│   └── process/          # Process service folder
|         └── index.ts/   # Process service entry point
│   └── consumer/         # Consumer service folder
├── turbo.json            # Turbo configuration
├── pnpm-workspace.yaml   
└── package.json          
```

### Create a new package

```bash
mkdir -p packages/process-package
cd packages/process-package
pnpm init
```
