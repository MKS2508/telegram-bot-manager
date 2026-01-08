/**
 * Library exports for TUI.
 */

export {
  tuiLogger,
  agentLogger,
  toolsLogger,
  statsLogger,
  errorLogger,
  fileLogger,
  bgopsLogger,
  configureTUILogger
} from './logger.js'

export {
  categorizeError,
  logIfError,
  errorToLogEntry,
  getCategoryDescription
} from './error-categorizer.js'

export type { ErrorCategory, CategorizedError } from './error-categorizer.js'

export {
  FileLogger,
  getGlobalFileLogger
} from './file-logger.js'

export type { LogFileConfig } from '../types.js'

export {
  OperationQueue,
  getGlobalQueue
} from './operation-queue.js'

export type {
  BackgroundOperation,
  OperationStatus,
  OperationExecutor,
  QueueConfig,
  QueueStats
} from './operation-queue.js'

export {
  AgentBridge,
  getGlobalBridge
} from './agent-bridge.js'

export type {
  AgentCallbacks,
  AgentResult,
  AgentOptions,
  AgentUsage,
  ToolCallLog
} from './agent-bridge.js'
