/**
 * Logs Panel Component.
 *
 * Displays filtered log entries.
 */

import { Box, Text, TextAttributes } from '@opentui/core'
import type { LogEntry } from '../types.js'
import { LogLevel } from '../types.js'
import { getRecentLogs, getLogFilter } from '../hooks/index.js'

/**
 * Logs Panel Props.
 */
export interface LogsPanelProps {
  filterLevel: LogLevel
  onFilterChange?: (level: LogLevel) => void
}

/**
 * Render logs panel.
 */
export function LogsPanel({ filterLevel: _filterLevel }: LogsPanelProps): any {
  // Get fresh logs on every render
  const currentFilter = getLogFilter()
  const recentLogs = getRecentLogs(20)

  return Box(
    {
      borderStyle: 'single',
      border: true,
      padding: 1,
      flexDirection: 'column',
      height: 15
    },
    Text({
      content: `📋 Logs [${LogLevel[currentFilter.level]}] (Press Ctrl+L to change)`,
      attributes: TextAttributes.BOLD
    }),
    Text({ content: '─'.repeat(70) }),

    recentLogs.length > 0 ?
      renderLogs(recentLogs) :
      Text({ content: 'No logs yet', attributes: TextAttributes.DIM })
  )
}

/**
 * Render log entries.
 */
function renderLogs(logs: LogEntry[]): any[] {
  return logs.map(log => renderLogEntry(log))
}

/**
 * Render single log entry.
 */
function renderLogEntry(log: LogEntry): any {
  const levelIcon = getLevelIcon(log.level)
  const timestamp = formatTimestamp(log.timestamp)
  const component = log.component.padEnd(8)

  return Text({
    content: `${levelIcon} ${timestamp} [${component}] ${log.message}`,
    attributes: log.level === 3 ? TextAttributes.DIM : TextAttributes.NONE
  })
}

/**
 * Get icon for log level.
 */
function getLevelIcon(level: LogLevel): string {
  switch (level) {
    case 0: return '🔍' // DEBUG
    case 1: return 'ℹ️'  // INFO
    case 2: return '⚠️'  // WARN
    case 3: return '❌'  // ERROR
    default: return '•'
  }
}

/**
 * Format timestamp for display.
 */
function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}
