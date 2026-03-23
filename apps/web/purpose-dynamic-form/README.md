# Dynamic Form Engine

A dynamic form engine that generates forms from two standard spec files: **JSON Schema** for validation and **UI Schema** (JSON Forms format) for rendering. Supports dynamic validation, conditional field visibility, and option-level filtering at runtime.

## Stack

React 19, Zod 4, AJV, TanStack Form, react-aria-components, @knodia/ui-kit, Tailwind CSS 4, TanStack Router, ts-pattern, Vite, Vitest.

## Getting started

From the monorepo root:

```bash
pnpm install                                              # install all deps
pnpm --filter purpose-dynamic-form dev            # start dev server (port 5674)
pnpm --filter purpose-dynamic-form typecheck      # typecheck
pnpm --filter purpose-dynamic-form test           # run tests
pnpm --filter purpose-dynamic-form lint           # lint
```

## Architecture

```
src/
  schemas/       JSON Schema + UI Schema spec files (pa31, two-form)
  engine/        Pure logic: schema parsing, dependency resolution, Zod generation
  hooks/         React hooks: dynamic form state, visible fields
  renderers/     react-aria renderers, ui-kit renderers, and JSON Forms renderers (swappable)
  components/    Form layout components (DynamicForm with group-based section rendering)
  demo/          Demo pages
```

## How it works

Each form is defined by two JSON files, with no application code needed:

### JSON Schema (`schema.json`)

Standard [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/json-schema-core). Defines:

- **Data structure**: field types (`string`, `array`), constraints (`enum`, `maxLength`, `minLength`, `uniqueItems`)
- **Static required fields**: `required: ["field1", "field2"]`
- **Conditional required fields**: `allOf[].if/then/else` blocks that activate requirements based on current values

Example: if `personalDataTypes` contains `"OTHER"`, then `otherPersonalDataTypes` becomes required.

### UI Schema (`uischema.json`)

Uses the [JSON Forms UI Schema](https://jsonforms.io/docs/uischema/) format. Defines:

- **Widget types**: `radio`, `text`, `textarea`, `checkbox`, `select`, `switch`
- **Layout**: groups/sections with titles and descriptions, horizontal/vertical arrangement
- **Visibility rules**: `rule.effect: "SHOW"` or `"HIDE"` with conditions on other field values
- **Option hiding**: `hideOptions` to conditionally hide individual options within a field
- **Labels**: non-field informational elements (e.g., info banners with conditional visibility)

#### UI Schema extensions

The following custom properties live under `options`, which JSON Forms declares as extensible:

| Property                | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `options.infoLabel`     | Help text displayed below the field label                  |
| `options.description`   | Description text below switch/checkbox controls            |
| `options.layout`        | `"horizontal"` or `"vertical"` for radio/checkbox layout   |
| `options.optionLabels`  | Value-to-label map for enum/radio/checkbox                 |
| `options.hideOptions`   | Conditionally hide individual options based on form values |
| `options.errorMessages` | Custom error messages keyed by validation keyword          |

## Engine

The engine (`src/engine/`) is a set of **pure functions** with no React dependencies. Each module has a single responsibility:

| Module               | Purpose                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `schemaParser`       | Extracts default values from JSON Schema properties                                       |
| `uischemaParser`     | Traverses the UI Schema tree to collect controls, groups, error messages                  |
| `dependencyResolver` | Evaluates visibility rules and returns the set of currently visible fields                |
| `requiredFields`     | Evaluates `allOf` conditionals to compute which fields are required at runtime            |
| `optionFilter`       | Evaluates `hideOptions` conditions to determine which options to hide per field           |
| `zod/schemaBuilder`  | Generates a Zod schema for **only the visible fields**, with dynamic required constraints |
| `ajv/validation`     | Alternative validator using AJV instead of Zod, same `ValidateFn` interface               |

Key behavior: **visibility drives everything**. Hidden fields retain their values in state but are excluded from validation and submission.

## Design system agnostic

The architecture has three independent decoupling points:

1. **Rendering**: the `renderers/` directory contains all design-system-specific code. Three implementations exist side by side: plain react-aria-components (`renderers/`), @knodia/ui-kit (`renderers/uikit/`), and JSON Forms (`renderers/jsonforms/`). Replace or add renderer sets to use any other component library. The engine and hooks layers are untouched.

2. **Validation**: the engine exposes a `ValidateFn` interface: `(values, visibleFields) => Record<string, string>`. Both `createZodValidator` and `createAjvValidator` implement it. Swap in any validation library by implementing this signature.

3. **Form state**: `DynamicForm` manages state with plain `useState`. The `TwoFormTanstackAjvPage` demo shows the same engine powered by TanStack Form instead, using `useForm` for state and AJV for validation. The engine functions accept and return simple `Record<string, string | string[]>` values, compatible with any state management approach.

## Two-form model

The intended real-world usage has two forms:

1. **Static form**: a hardcoded React component with fixed questions
2. **Dynamic form**: rendered by this engine from JSON Schema + UI Schema

The static form's fields are defined in the same JSON Schema and UI Schema as the dynamic form's fields. The engine handles both in a single form, using visibility rules and conditional requirements to show/hide fields based on current values. Only visible fields are validated and submitted.
