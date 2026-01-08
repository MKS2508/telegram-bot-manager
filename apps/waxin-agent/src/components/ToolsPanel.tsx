/**
 * Tools Panel Component.
 *
 * Displays tool calls and background operations.
 */

import { Box, Text, TextAttributes } from '@opentui/core'
import type { BackgroundOperation } from '../lib/operation-queue.js'
import { formatOperationStatus, formatOperationDuration } from '../hooks/useOperations.js'

/**
 * Tools Panel Props.
 */
export interface ToolsPanelProps {
  operations: BackgroundOperation[]
  onCancel?: (id: string) => void
}

/**
 * Render tools panel.
 */
export function ToolsPanel({ operations }: ToolsPanelProps): any {
  const running = operations.filter(op => op.status === 'running')
  const completed = operations.filter(op => op.status === 'completed')
  const failed = operations.filter(op => op.status === 'failed')

  return Box(
    {
      borderStyle: 'single',
      border: true,
      padding: 1,
      flexDirection: 'column',
      width: 35
    },
    Text({ content: '🔧 Tools Panel', attributes: TextAttributes.BOLD }),
    Text({ content: '─'.repeat(33) }),
    Text({ content: '' }),

    running.length > 0 ? renderOperationList('Running', running) : null,
    completed.length > 0 ? renderOperationList('Completed', completed.slice(-5)) : null,
    failed.length > 0 ? renderOperationList('Failed', failed.slice(-3)) : null,

    operations.length === 0 ?
      Text({ content: 'No operations', attributes: TextAttributes.DIM }) :
      Text({ content: `Total: ${operations.length}`, attributes: TextAttributes.DIM })
  )
}

/**
 * Render operation list.
 */
function renderOperationList(
  title: string,
  operations: BackgroundOperation[]
): any {
  return Box(
    { flexDirection: 'column' },
    Text({ content: `${title}: ${operations.length}`, attributes: TextAttributes.DIM }),
    ...operations.map(op => renderOperation(op))
  )
}

/**
 * Render single operation.
 */
function renderOperation(operation: BackgroundOperation): any {
  const statusIcon = formatOperationStatus(operation.status)
  const duration = operation.completedAt ? formatOperationDuration(operation) : '...'
  const toolName = operation.tool.length > 20
    ? operation.tool.slice(0, 17) + '...'
    : operation.tool

  return Text({
    content: `${statusIcon} ${toolName} (${duration})`,
    attributes: operation.status === 'failed' ? TextAttributes.DIM : TextAttributes.NONE
  })
}
