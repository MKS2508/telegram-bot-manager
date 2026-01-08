/**
 * Shared types for the Bot Manager Agent TUI.
 */

/**
 * Log levels for filtering and display.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Log entry structure.
 */
export interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: unknown
}

/**
 * Log filter configuration.
 */
export interface LogFilter {
  level: LogLevel
  component?: string
  search?: string
  since?: Date
}

/**
 * Agent stats structure.
 */
export interface AgentStats {
  sessionId: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  totalCostUsd: number
  durationMs: number
  toolCallsCount: number
  errorsCount: number
}

/**
 * Agent result from execution.
 */
export interface AgentResult {
  success: boolean
  result: string | null
  sessionId: string
  toolCalls: ToolCallLog[]
  errors: string[]
  usage: AgentUsage
  durationMs: number
}

/**
 * Agent usage information.
 */
export interface AgentUsage {
  inputTokens: number
  outputTokens: number
  totalCostUsd: number
}

/**
 * Tool call log entry.
 */
export interface ToolCallLog {
  tool: string
  input: unknown
  result: string
}

/**
 * Output mode for agent responses.
 */
export type OutputMode = 'streaming' | 'final' | 'progress'

/**
 * TUI configuration options.
 */
export interface TUIConfig {
  outputMode: OutputMode
  showToolCalls: boolean
  showThinking: boolean
}

/**
 * Agent callbacks for streaming and progress.
 */
export interface AgentCallbacks {
  onMessage?: (message: unknown) => void
  onAssistantMessage?: (text: string) => void
  onToolCall?: (tool: string, input: unknown) => void
  onProgress?: (progress: number, message: string) => void
  onThinking?: (text: string) => void
}

/**
 * Agent execution options.
 */
export interface AgentOptions {
  workingDirectory?: string
  maxTurns?: number
  model?: string
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions'
  includePartial?: boolean
  resumeSession?: string
}

/**
 * Log file configuration.
 */
export interface LogFileConfig {
  directory: string
  maxSize: number
  maxFiles: number
  pattern: string
}
