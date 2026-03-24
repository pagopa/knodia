# Dynamic Form Engine

A dynamic form engine that generates forms from two standard spec files: **JSON Schema** for validation and **UI Schema** (JSON Forms format) for rendering. Supports dynamic validation, conditional field visibility, option-level filtering, and multiple layout modes at runtime.

## Stack

React 19, Zod 4, AJV 8, TanStack Form, TanStack Router, react-aria-components, @knodia/ui-kit, Tailwind CSS 4, ts-pattern, Vite, Vitest.

## Getting started

From the monorepo root:

```bash
pnpm install                                     # install all deps
pnpm --filter purpose-dynamic-form dev           # start dev server (port 5674)
pnpm --filter purpose-dynamic-form typecheck     # typecheck
pnpm --filter purpose-dynamic-form test          # run tests
pnpm --filter purpose-dynamic-form lint          # lint
```

## Architecture

```
src/
  schemas/       JSON Schema + UI Schema spec files (pa31, two-form, data-sharing, layout variants)
  engine/        Pure logic: schema parsing, dependency resolution, Zod/AJV validation
  hooks/         React hooks: visible field tracking
  renderers/     react-aria, ui-kit, and JSON Forms renderers (swappable)
  components/    Form layout components (DynamicForm, GroupSection, StepIndicator)
  demo/          Demo pages showcasing different combinations of schema, renderer, and validator
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
- **Labels**: non-field informational elements (e.g., banners with conditional visibility and variant styling)

All UI schemas are validated against a [meta-schema](src/schemas/uischema.schema.json) to catch structural errors early.

#### UI Schema extensions

The following custom properties live under `options`, which JSON Forms declares as extensible:

| Property                | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `options.infoLabel`     | Help text displayed below the field label                    |
| `options.description`   | Description text below switch/checkbox controls              |
| `options.layout`        | `"horizontal"` or `"vertical"` for radio/checkbox layout     |
| `options.optionLabels`  | Value-to-label map for enum/radio/checkbox                   |
| `options.hideOptions`   | Conditionally hide individual options based on form values   |
| `options.errorMessages` | Custom error messages keyed by validation keyword            |
| `options.variant`       | Banner variant for Label elements: `"info"`, `"warning"`, `"error"` |

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

## Layout modes

The same data schema can be rendered in different layouts by varying the UI Schema structure:

| Mode            | UI Schema shape                    | Component           | Demo page                |
| --------------- | ---------------------------------- | ------------------- | ------------------------ |
| **Multi-step**  | Top-level Groups as steps          | `TwoFormPage`       | `TwoFormPage` + variants |
| **Grouped**     | Groups rendered as sections        | `DynamicForm`       | `CompactFormPage`        |
| **Flat**        | Controls without group wrappers    | `DynamicForm`       | `FlatFormPage`           |
| **Three-step**  | Groups split across three steps    | `ThreeStepFormPage` | `ThreeStepFormPage`      |

All layout variants reuse the same engine, hooks, and renderers. Only the page-level component decides how to present groups.

## Schemas

| Schema             | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `pa31`             | PDND PA 3.1 risk analysis form                                 |
| `two-form`         | Full-featured demo with conditional visibility and requirements |
| `data-sharing`     | Data sharing agreement form                                    |
| `compact-form`     | Grouped layout variant (reuses `two-form` data schema)         |
| `flat-form`        | Flat layout variant (reuses `two-form` data schema)            |
| `three-step-form`  | Three-step layout variant (reuses `two-form` data schema)      |

## Two-form model

The intended real-world usage has two forms:

1. **Static form**: a hardcoded React component with fixed questions
2. **Dynamic form**: rendered by this engine from JSON Schema + UI Schema

The static form's fields are defined in the same JSON Schema and UI Schema as the dynamic form's fields. The engine handles both in a single form, using visibility rules and conditional requirements to show/hide fields based on current values. Only visible fields are validated and submitted.

## Testing

- **Engine unit tests**: `dependencyResolver`, `optionFilter`, `schemaBuilder` tested with Vitest
- **Data schema validation**: AJV tests verify all JSON Schemas handle conditional requirements correctly (`schemas/schema.test.ts`)
- **UI Schema validation**: all UI Schemas validated against a meta-schema to catch structural errors (`schemas/uischema.schema.test.ts`)
