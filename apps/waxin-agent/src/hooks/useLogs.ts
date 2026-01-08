/**
 * useLogs hook - Log management and filtering.
 *
 * Manages log entries with filtering and file persistence.
 */

import { FileLogger, getGlobalFileLogger, tuiLogger } from '../lib/index.js'
import type { LogEntry, LogFilter } from '../types.js'
import { LogLevel } from '../types.js'

/**
 * Logs state.
 */
const logs: LogEntry[] = []
let fileLogger: FileLogger | null = null
let filter: LogFilter = { level: 1 } // INFO by default

/**
 * Add a log entry.
 */
export function addLog(entry: LogEntry): void {
  logs.push(entry)

  // Write to file
  if (!fileLogger) {
    fileLogger = getGlobalFileLogger()
  }

  const logLine = `[${entry.timestamp}] [${LogLevel[entry.level]}] [${entry.component}] ${entry.message}`
  fileLogger.write(logLine)
}

/**
 * Add a quick log message (convenience function).
 */
export function log(
  level: LogLevel,
  component: string,
  message: string,
  data?: unknown
): void {
  addLog({
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    data
  })
}

/**
 * Quick log functions.
 */
export const logDebug = (component: string, message: string, data?: unknown) => log(0, component, message, data)
export const logInfo = (component: string, message: string, data?: unknown) => log(1, component, message, data)
export const logWarn = (component: string, message: string, data?: unknown) => log(2, component, message, data)
export const logError = (component: string, message: string, data?: unknown) => log(3, component, message, data)

/**
 * Get all logs (filtered).
 */
export function getLogs(): LogEntry[] {
  return logs.filter(logEntry => {
    if (logEntry.level < filter.level) return false
    if (filter.component && logEntry.component !== filter.component) return false
    if (filter.search && !logEntry.message.includes(filter.search)) return false
    if (filter.since && new Date(logEntry.timestamp) < filter.since) return false
    return true
  })
}

/**
 * Get logs by level.
 */
export function getLogsByLevel(level: LogLevel): LogEntry[] {
  return logs.filter(log => log.level === level)
}

/**
 * Get logs by component.
 */
export function getLogsByComponent(component: string): LogEntry[] {
  return logs.filter(log => log.component === component)
}

/**
 * Get recent logs.
 */
export function getRecentLogs(count = 50): LogEntry[] {
  return getLogs().slice(-count)
}

/**
 * Set log filter.
 */
export function setLogFilter(newFilter: Partial<LogFilter>): void {
  filter = { ...filter, ...newFilter }
  tuiLogger.info(`Log filter updated: level=${LogLevel[filter.level]}`)
}

/**
 * Get current filter.
 */
export function getLogFilter(): LogFilter {
  return { ...filter }
}

/**
 * Clear all logs.
 */
export function clearLogs(): void {
  logs.length = 0
  tuiLogger.info('Logs cleared')
}

/**
 * Get log count by level.
 */
export function getLogCount(): {
  debug: number
  info: number
  warn: number
  error: number
  total: number
} {
  return {
    debug: logs.filter(l => l.level === 0).length,
    info: logs.filter(l => l.level === 1).length,
    warn: logs.filter(l => l.level === 2).length,
    error: logs.filter(l => l.level === 3).length,
    total: logs.length
  }
}

/**
 * Export logs to string.
 */
export function exportLogsToString(): string {
  return logs
    .map(entry => {
      const level = LogLevel[entry.level]
      return `[${entry.timestamp}] [${level}] [${entry.component}] ${entry.message}`
    })
    .join('\n')
}

/**
 * Initialize log system with file logger.
 */
export function initLogs(config?: { maxLogLines?: number; logDirectory?: string }): void {
  if (config?.logDirectory) {
    fileLogger = new FileLogger({
      directory: config.logDirectory,
      maxSize: 10 * 1024 * 1024,
      maxFiles: 5,
      pattern: 'tui-debug-YYYY-MM-DD.log'
    })
  }

  tuiLogger.info('Log system initialized')
}
