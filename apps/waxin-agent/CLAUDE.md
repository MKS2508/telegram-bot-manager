# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**waxin-agent** is a Terminal User Interface (TUI) for debugging and testing the Bot Manager Agent. It is part of the **telegram-bot-manager** monorepo, which provides a TypeScript library and CLI for automating Telegram bot management via BotFather.

### Monorepo Context

```
telegram-bot-manager/                    # Monorepo root
├── core/packages/main/                  # @mks2508/telegram-bot-manager
│   └── src/
│       ├── client.ts                    # BootstrapClient (GramJS wrapper)
│       ├── bot-father/                  # BotFather automation
│       ├── group-manager.ts             # Group/Forum management
│       ├── topic-manager.ts             # Forum topic creation
│       ├── env-manager.ts               # Multi-bot .env management
│       └── cli/                         # CLI commands
├── apps/
│   └── waxin-agent/                     # ← This TUI application
│       └── src/
│           ├── lib/agent-bridge.ts      # Agent SDK wrapper
│           ├── hooks/                   # State management
│           └── app.tsx                  # OpenTUI application
├── docs/                                # Documentation
└── package.json                         # Monorepo config (workspaces)
```

### Relationship to Main Package

The waxin-agent TUI is a **development/testing tool** that complements the main `@mks2508/telegram-bot-manager` package:

- **Main package**: Library + CLI for Telegram bot automation (BotFather, Groups, Topics)
- **waxin-agent**: TUI for interactive debugging and testing of agent operations

This TUI uses `@anthropic-ai/claude-agent-sdk` to execute agent commands interactively, with real-time streaming output, statistics tracking, and log management.

### Tech Stack

- **Runtime**: Bun (Node.js-compatible)
- **TUI Framework**: `@opentui/core` - Terminal rendering with Box/Text/Textarea renderables
- **Agent SDK**: `@anthropic-ai/claude-agent-sdk` - Agent execution via `query()` generator
- **Logging**: `@mks2508/better-logger` - Categorized component loggers with presets (shared with main package)
- **Type Safety**: TypeScript with strict mode enabled

### Shared Dependencies with Main Package

Both `@mks2508/telegram-bot-manager` and `waxin-agent` use:
- `@mks2508/better-logger` - Structured logging with presets (cyberpunk, minimal)
- `@mks2508/no-throw` - Error handling utilities

See the main package's CLAUDE.md at `/Users/mks/telegram-bot-manager/CLAUDE.md` for details on:
- BotFather automation patterns
- Group/Forum management via `channels.CreateChannel`
- Topic management via Bot API
- Environment file structure (`core/.envs/{botUsername}/{environment}.env`)

---

## Commands

### Development

```bash
bun run dev        # Start TUI in watch mode (auto-reload on file changes)
bun run build      # Compile TypeScript (tsgo - no output files, type-check only)
bun run typecheck  # Type check without building
bun run lint       # Lint with oxlint
bun run lint:fix   # Auto-fix lint issues
```

### Configuration

- **Environment variables**: Load from `.env` file in project root
- **Required**: `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` (sk-ant-...)
- **Optional**: `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL` (defaults to claude-sonnet-4-5-20250929)

---

## Architecture

### Core Pattern: Hooks + Libraries + Agent Bridge

The TUI is structured around three main layers:

1. **AgentBridge** (`lib/agent-bridge.ts`) - Wraps `@anthropic-ai/claude-agent-sdk` `query()`
2. **Hooks** (`hooks/`) - State management for agent, stats, logs, and operations
3. **TUI App** (`app.tsx`) - OpenTUI renderables with real-time updates

### Data Flow

```
User Input (Textarea)
    ↓
useAgent.execute()
    ↓
AgentBridge.query() → Agent SDK
    ↓
Streaming callbacks (onMessage, onAssistantMessage, onToolCall)
    ↓
Update TUI panels (stats, output, logs)
```

### Key Libraries

**`lib/agent-bridge.ts`**
- Wraps the `query()` generator from `@anthropic-ai/claude-agent-sdk`
- Emits messages via callbacks: `onMessage`, `onAssistantMessage`, `onToolCall`
- Returns `AgentResult` with usage, tokens, cost, duration, errors

**`lib/operation-queue.ts`**
- Background operation queue with retry logic
- Singleton via `getGlobalQueue()`
- Configurable: maxConcurrent, retryAttempts, retryDelay

**`lib/logger.ts`**
- Component loggers: `tuiLogger`, `agentLogger`, `toolsLogger`, `statsLogger`, `errorLogger`, `fileLogger`, `bgopsLogger`
- Presets: `configureTUILogger('cyberpunk' | 'minimal')`

**`lib/file-logger.ts`**
- Rotating log files with maxSize/maxFiles limits
- Singleton via `getGlobalFileLogger()`

**`lib/error-categorizer.ts`**
- Categorizes errors for better debugging

### Hooks

**`useAgent`** - Agent lifecycle management
- `execute(prompt, options, callbacks)` → AgentResult
- `getStats()` → AgentStats
- `getSessionId()` → string
- `clear()` → reset state
- Singleton bridge instance

**`useStats`** - Stats aggregation
- `updateStats(stats)` - Update current stats
- `getStats()` → AgentStats | null
- `getStatsHistory()` → StatsHistoryEntry[]
- `getAggregatedStats()` → Aggregated across all sessions
- Formatters: `formatTokens`, `formatCost`, `formatDuration`

**`useLogs`** - Log management with filtering
- `addLog(entry)` - Add log entry
- `logInfo`, `logDebug`, `logWarn`, `logError` - Convenience functions
- `getLogs()`, `getRecentLogs(count)` - Filtered logs
- `setLogFilter(filter)` - Set LogFilter { level, component, search, since }
- `initLogs({ logDirectory })` - Initialize file logger

**`useOperations`** - Background operations
- `enqueueOperation(tool, input)` → operation ID
- `cancelOperation(id)` → boolean
- `getOperations()`, `getOperationsByStatus(status)`
- `enableAutoProcessing(intervalMs)` - Start queue processing
- `disableAutoProcessing()` - Stop queue processing

### TUI Panels

**Stats Panel** (`components/StatsPanel.tsx`)
- Displays current agent stats (tokens, cost, duration, tools, errors)

**Output Panel** (`components/OutputPanel.tsx`)
- Shows assistant messages (streaming or final)

**Logs Panel** (`components/LogsPanel.tsx`)
- Real-time log viewer with filtering by level (DEBUG/INFO/WARN/ERROR)
- Press Ctrl+L to toggle log level

**Tools Panel** (`components/ToolsPanel.tsx`)
- Displays tool calls and results

**Input Panel** (`components/InputPanel.tsx`)
- Textarea for user prompts
- Enter: send, Shift+Enter: new line, Ctrl+K: clear

### Main App Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Bot Manager Agent TUI                                    │
├──────────────────┬──────────────────────────────────────────┤
│  📊 Stats        │  Output Panel                             │
│  (tokens, cost)  │  (assistant messages)                    │
├──────────────────┴──────────────────────────────────────────┤
│  📋 Logs [INFO] (Press Ctrl+L to change)                    │
│  • Real-time log entries with filtering                     │
├─────────────────────────────────────────────────────────────┤
│  💬 Prompt                                                    │
│  [Enter: send | Shift+Enter: new line | Ctrl+L: logs]      │
└─────────────────────────────────────────────────────────────┘
```

### Keybindings

- **Enter** - Send prompt
- **Shift+Enter** - New line in textarea
- **Ctrl+L** - Toggle log level filter
- **Ctrl+K** - Clear input
- **Esc** - Exit TUI
- **F1** - Help

---

## TypeScript Configuration

- **Target**: ES2022, Module: ESNext
- **Strict mode**: Enabled (noImplicitAny, strictNullChecks, etc.)
- **Module resolution**: bundler (for Bun compatibility)
- **JSX**: react with custom factory (Box for both elements and fragments)
- **noEmit**: true (type-check only)

---

## Important Implementation Details

### Agent Execution Flow

1. User enters prompt in Textarea
2. `useAgent.execute()` called with AgentCallbacks
3. `AgentBridge.query()` iterates over messages from Agent SDK
4. Callbacks emit: onMessage (raw), onAssistantMessage (text), onToolCall (tool, input)
5. TUI updates panels in real-time
6. Final result includes usage, tokens, cost, duration, errors

### Log Filtering

Logs are stored in memory with filtering:
- `level` - LogLevel enum (DEBUG=0, INFO=1, WARN=2, ERROR=3)
- `component` - Filter by component name (e.g., "AGENT", "TUI")
- `search` - Filter by message text
- `since` - Filter by timestamp

### Frame Callbacks

The TUI uses `renderer.setFrameCallback()` for periodic updates:
- Runs every frame (~30-60 FPS)
- Used to update logs panel and stats panel
- Check `frameCounter % 30` to limit updates (~2/sec)

### Global Singletons

- `AgentBridge` via `getGlobalBridge()`
- `OperationQueue` via `getGlobalQueue(config?)`
- `FileLogger` via `getGlobalFileLogger()`

### Error Handling

- Errors are categorized via `categorizeError()` from `error-categorizer.ts`
- Agent errors appear in `AgentResult.errors` array
- File logger writes to `./logs/tui-debug-YYYY-MM-DD.log`

---

## Integration with Main Package

### Using the Main Package from TUI

The waxin-agent TUI can test and debug operations from the main package:

```typescript
// Example: Testing BotFather operations via TUI
import { BotFatherManager } from '@mks2508/telegram-bot-manager'

// In your agent tools, you can wrap main package functions:
async function createBotTool(name: string) {
  const manager = new BotFatherManager(client)
  return await manager.createBot(name)
}
```

### Tool Registration

The TUI's `AgentBridge` can execute tools that interact with the main package:
- BotFather operations (create bots, set commands, configure descriptions)
- Group management (create supergroups, convert to forums)
- Topic management (create/delete forum topics)
- Environment management (multi-bot .env files)

### Environment Variables

Both packages share similar environment configuration:
- `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` - For agent SDK
- `GRAMJS_SESSION` - Path to GramJS session file (main package)
- `BOT_TOKEN_*` - Individual bot tokens (managed by EnvManager)

---

## Development Notes

### Adding New Panels

1. Create component in `src/components/`
2. Add to `src/components/index.ts`
3. Import and render in `src/app.tsx`
4. Update panel layout (positions are absolute)

### Adding New Loggers

```typescript
// In src/lib/logger.ts
export const myLogger = component('MYCOMPONENT')

// Use anywhere
import { myLogger } from './lib/logger.js'
myLogger.info('Message')
```

### Extending AgentCallbacks

The `AgentCallbacks` interface supports:
- `onMessage` - Raw message from Agent SDK
- `onAssistantMessage` - Text content from assistant
- `onToolCall` - Tool invocation with input
- `onProgress` - Progress updates (0-100)
- `onThinking` - Thinking/reasoning text

Add new callbacks to `src/types.ts` and implement in `src/app.tsx`.

### Debugging Agent Issues

- Check `agentLogger.debug()` output for environment variables
- Verify `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` is set
- Look for specific error types: AUTHENTICATION_FAILED, RATE_LIMIT_EXCEEDED, CONTEXT_LENGTH_EXCEEDED
- Enable debug logs with `setLogFilter({ level: 0 })` (DEBUG level)

---

## File Structure

```
src/
├── index.ts              # Entry point (dotenv, startTUI)
├── app.tsx               # Main TUI application
├── types.ts              # Shared types (LogLevel, AgentStats, etc.)
├── components/           # TUI panels (Stats, Output, Logs, Tools, Input)
├── hooks/                # State management hooks
│   ├── useAgent.ts       # Agent lifecycle
│   ├── useStats.ts       # Stats aggregation
│   ├── useLogs.ts        # Log management
│   └── useOperations.ts  # Background operations
└── lib/                  # Core libraries
    ├── agent-bridge.ts   # Agent SDK wrapper
    ├── operation-queue.ts # Background task queue
    ├── logger.ts         # Better logger config
    ├── file-logger.ts    # File logging with rotation
    └── error-categorizer.ts # Error categorization
```
