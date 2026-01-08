/**
 * Output Panel Component.
 *
 * Displays agent conversation and results.
 */

import { Box, Text, TextAttributes } from '@opentui/core'
import type { AgentResult } from '../types.js'

/**
 * Output Panel Props.
 */
export interface OutputPanelProps {
  result: AgentResult | null
  isExecuting: boolean
}

/**
 * Render output panel.
 */
export function OutputPanel({ result, isExecuting }: OutputPanelProps): any {
  return Box(
    {
      borderStyle: 'single',
      border: true,
      padding: 1,
      flexDirection: 'column',
      flexGrow: 1
    },
    Text({
      content: `💬 Agent Output ${isExecuting ? '(running...)' : ''}`,
      attributes: TextAttributes.BOLD
    }),
    Text({ content: '─'.repeat(60) }),
    Text({ content: '' }),

    isExecuting ? Text({ content: '⏳ Executing...' }) :

    result ? renderResult(result) :

    Text({ content: 'No results yet. Send a prompt to see output.', attributes: TextAttributes.DIM })
  )
}

/**
 * Render agent result.
 */
function renderResult(result: AgentResult): any {
  return Box(
    { flexDirection: 'column' },
    Text({ content: `Session: ${result.sessionId}` }),
    Text({ content: '' }),
    Text({ content: result.result || 'No result', attributes: result.success ? TextAttributes.NONE : TextAttributes.DIM }),
    Text({ content: '' }),

    result.toolCalls.length > 0 ? Text({ content: `Tool calls: ${result.toolCalls.length}`, attributes: TextAttributes.DIM }) : null,
    result.errors.length > 0 ? Text({ content: `Errors: ${result.errors.length}`, attributes: TextAttributes.DIM }) : null
  )
}
