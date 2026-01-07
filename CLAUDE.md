# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**telegram-bot-manager** is a Telegram Bot management library in TypeScript, using GramJS/Telegraf. It automates bot creation, management, and bot/group setups. This is a Bun-based monorepo for npm packages.

## CRITICAL: Development Guidelines

**ALL development MUST follow the rules in `MUST-FOLLOW-GUIDELINES.md`**

Key rules from MUST-FOLLOW-GUIDELINES.md:

### 1. JSDoc Completo Profesional
- ALL exported functions, classes, methods, interfaces, types, and constants MUST have complete JSDoc
- Required tags: `@description` (implicit), `@param`, `@returns`, `@example` (for public functions), `@throws`, `@see`

### 2. Logging - NUNCA console.log
```typescript
// CORRECTO
import { createLogger } from 'mks2508/utils/logger';
const log = createLogger('MyComponent');
log.info('Started');
log.success('Completed');

// INCORRECTO
console.log('Started');
```

### 3. Result Pattern - SIEMPRE
```typescript
import { ok, tryCatch, type Result } from 'mks2508/utils/result';
import { createAppError, AppErrorCode } from 'mks2508/utils/result';

async function fetchData(url: string): Promise<Result<string, AppError>> {
  const result = await tryCatch(async () => fetch(url), AppErrorCode.NetworkError);
  if (result.isErr()) {
    return createAppError(AppErrorCode.NetworkError, `Failed to fetch from ${url}`, result.error);
  }
  return ok(result.value);
}
```

### 4. Nomenclatura - Prefijo I
- Interfaces: `IOptions`, `ICallback` (with prefix I)
- Types: `Options`, `ErrorCode` (no prefix)

### 5. Barrel Exports - SIEMPRE
- Every folder with multiple files MUST have an `index.ts` barrel export

### 6. Async/Await - Preferencia
- Prefer async/await over Promise chaining

## Monorepo Stack

| Tool | Version/Config | Use |
|------|----------------|-----|
| **Runtime** | Bun v1.1.43+ | Package manager + runtime |
| **Bundling** | Rolldown v1.0.0-beta.58 | Package builds |
| **Type Checking** | TSGO v7.0.0-dev (@typescript/native-preview) | TypeScript compiler |
| **Linting** | Oxlint v0.11.1 | Fast linting (OxC-based) |
| **Formatting** | Prettier v3.4.2 + organize-imports | Code formatting |
| **Validation** | Arktype | Schema validation |
| **Versioning** | Changesets v2.27.11 | Package versioning |
| **Logging** | @mks2508/better-logger v4.0.0 | Structured logging |
| **Error Handling** | @mks2508/no-throw v0.1.0 | Result pattern |

## Commands

```bash
# Development - all workspaces
bun run dev          # Start dev mode for all packages

# Build - all workspaces
bun run build        # Build all packages

# Type checking
bun run typecheck    # Type check all packages (TSGO)

# Linting (Oxlint only - no ESLint)
bun run lint         # Run oxlint
bun run lint:fix     # Auto-fix oxlint issues

# Formatting (Prettier)
bun run format       # Format all files
bun run format:check # Check formatting

# Clean everything
bun run clean        # Remove node_modules, dist, .turbo

# Changesets (versioning)
bun run changeset              # Create a changeset
bun run changeset:version      # Apply changesets and bump versions
bun run changeset:publish      # Publish packages to npm
```

## Monorepo Structure

```
├── core/
│   └── packages/
│       ├── utils/              # Shared utilities package
│       │   ├── src/
│       │   │   ├── logger.ts   # Logging wrapper (@mks2508/better-logger)
│       │   │   ├── result.ts   # Result wrapper (@mks2508/no-throw)
│       │   │   └── index.ts    # Barrel export
│       │   ├── rolldown.config.ts
│       │   └── package.json
│       └── main/               # Main library package
│           ├── src/
│           │   ├── types/      # Domain types with barrel export
│           │   ├── utils/      # Local utilities with barrel export
│           │   └── index.ts    # Main export
│           ├── rolldown.config.ts
│           └── package.json    # Depends on utils via workspace:*
└── apps/
    └── example/                # Example app
        └── package.json        # Depends on utils and main via workspace:*
```

**Workspace Pattern:**
- Packages in `core/packages/*` and `apps/*` are auto-discovered via Bun workspaces
- Internal dependencies use `"mks2508/package": "workspace:*"`
- Root `package.json` defines shared devDependencies

## Package Structure

Every package follows this structure:

```
core/packages/main/
├── src/
│   ├── utils/               # Local utilities
│   │   └── index.ts         # Barrel export
│   ├── types/               # Domain types
│   │   ├── *.types.ts       # Specific types
│   │   ├── constants.ts     # Constants
│   │   └── index.ts         # Barrel export
│   ├── *.ts                 # Main source
│   └── index.ts             # Main export
├── dist/                    # Build output
├── package.json
├── rolldown.config.ts
└── tsconfig.json
```

## Shared Utilities

The `mks2508/utils` package provides shared wrappers:

### Logger (`mks2508/utils/logger`)

Wrapper around `@mks2508/better-logger` with preset configured:
```typescript
import { createLogger } from 'mks2508/utils/logger';

const log = createLogger('ComponentName');
log.info('Message');
log.success('Success!');
```

### Result (`mks2508/utils/result`)

Wrapper around `@mks2508/no-throw` with domain-specific error codes:
```typescript
import { ok, tryCatch, createAppError, type Result } from 'mks2508/utils/result';

const result: Result<string> = ok('success');
const error = createAppError(AppErrorCode.NetworkError, 'Failed to fetch');
```

## Tool Configuration

### TypeScript/TSGO (`tsconfig.json`)
- Target: ES2022, Module: ESNext
- Strict mode enabled
- `moduleResolution: "bundler"`
- Key options: `verbatimModuleSyntax: true`, `declaration: true`
- Compiler: TSGO (@typescript/native-preview) for faster type checking
- Relaxed options: `noImplicitReturns: false`, `noUncheckedIndexedAccess: false`, `exactOptionalPropertyTypes: false`

### Oxlint (`oxlint.json`)
- Categories: `correctness`, `suspicious`, `perf`, `style` -> "warn"
- `restriction` -> "off"
- Env: `node`, `es2021`
- Ignores: `node_modules`, `dist`, `build`, `.turbo`, `coverage`

### Prettier
- Default config used (no .prettierrc found)
- Plugin: `prettier-plugin-organize-imports`

### Rolldown Build Config

**Utils package** (`core/packages/utils/rolldown.config.ts`):
- Multiple entry points: main `./src/index.ts`, `./src/logger.ts`, `./src/result.ts`
- ESM format with sourcemaps
- External: `@mks2508/better-logger`, `@mks2508/no-throw`

**Main package** (`core/packages/main/rolldown.config.ts`):
- Dual output: ESM (`./dist/index.js`) and CJS (`./dist/index.cjs`)
- External: `mks2508/utils`
- Named exports with sourcemaps

## Validation (Arktype)

Schema validation using Arktype:
```typescript
import { type } from 'arktype';

export const OptionsSchema = type({
  url: 'string',
  timeout: 'number.optional',
});

const result = OptionsSchema(options);
if (result instanceof type.errors) {
  return err(result.summary());
}
```

## Workspace Dependencies

When adding a new package dependency:

1. For shared packages: Add to appropriate `core/packages/*/package.json`
2. For workspace deps: Use `"mks2508/name": "workspace:*"`
3. For external deps: Add to root `package.json` devDependencies if used across multiple packages

```bash
bun install              # Install/resolves workspace dependencies
```

## Build Output Patterns

- **Rolldown**: Generates JS + sourcemaps, separate `tsgo --emitDeclarationOnly` for types
- Always ESM-first, CJS as optional compatibility layer (for main package)

## Pre-Commit Checklist

Before committing code:
- [ ] All new code has complete JSDoc
- [ ] No `console.log/debug/error/info/warn`
- [ ] Everything that can fail uses `Result<T, E>`
- [ ] Interfaces have `I` prefix
- [ ] Barrel exports in all folders
- [ ] Async/await instead of Promise chaining
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun run format` applied
