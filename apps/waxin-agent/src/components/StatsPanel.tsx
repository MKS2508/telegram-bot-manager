/**
 * Stats Panel Component.
 *
 * Displays agent execution statistics in real-time.
 */

import { Box, Text, TextAttributes } from '@opentui/core'
import type { AgentStats } from '../types.js'
import { formatTokens, formatCost, formatDuration } from '../hooks/useStats.js'

/**
 * Stats Panel Props.
 */
export interface StatsPanelProps {
  stats: AgentStats | null
}

/**
 * Render stats panel.
 */
export function StatsPanel({ stats }: StatsPanelProps): any {
  if (!stats) {
    return Box(
      { borderStyle: 'single', border: true, padding: 1 },
      Text({ content: '📊 No Stats' })
    )
  }

  return Box(
    {
      borderStyle: 'single',
      border: true,
      padding: 1,
      flexDirection: 'column',
      width: 30
    },
    Text({ content: '📊 Agent Stats', attributes: TextAttributes.BOLD }),
    Text({ content: '─'.repeat(28) }),
    Text({ content: '' }),
    Text({ content: `Session: ${stats.sessionId.slice(0, 8)}...` }),
    Text({ content: '' }),
    Text({ content: `Tokens: ${formatTokens(stats.totalTokens)}` }),
    Text({ content: `  Input:  ${formatTokens(stats.inputTokens)}` }),
    Text({ content: `  Output: ${formatTokens(stats.outputTokens)}` }),
    Text({ content: '' }),
    Text({ content: `Cost: ${formatCost(stats.totalCostUsd)}` }),
    Text({ content: '' }),
    Text({ content: `Duration: ${formatDuration(stats.durationMs)}` }),
    Text({ content: '' }),
    Text({ content: `Tool calls: ${stats.toolCallsCount}` }),
    Text({ content: `Errors: ${stats.errorsCount}` })
  )
}
