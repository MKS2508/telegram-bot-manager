/**
 * CLI Logger utility using @mks2508/better-logger.
 *
 * Provides structured logging for CLI commands following MUST-FOLLOW-GUIDELINES.
 *
 * @module
 */

import type { Ora } from 'ora'
import { createLogger, logger as rootLogger } from 'mks2508/utils'
import { spinnerWriter } from './spinner-writer.js'

/**
 * CLI logger instance for command-line interface operations.
 *
 * @example
 * ```typescript
 * import { cliLogger } from './utils/logger.js'
 *
 * cliLogger.info('Starting bootstrap...')
 * cliLogger.success('Bot created successfully')
 * cliLogger.error('Failed to connect', { error })
 * ```
 */
export const cliLogger = createLogger('CLI')

/**
 * Print a section title to the console.
 *
 * @param title - The title text to display
 *
 * @example
 * ```typescript
 * printTitle('🚀 Bootstrap')
 * ```
 */
export function printTitle(title: string): void {
  cliLogger.info('')
  cliLogger.info(`━━━ ${title} ━━━`)
  cliLogger.info('')
}

/**
 * Enable spinner mode - routes all logger output to ora spinner.text.
 *
 * Use this when you want log messages to update the spinner text
 * instead of printing to console (which would break the spinner animation).
 *
 * @param spinner - The ora spinner instance to route logs to
 *
 * @example
 * ```typescript
 * const spinner = ora('Loading...').start()
 * enableSpinnerMode(spinner)
 *
 * cliLogger.info('Step 1...')  // Updates spinner.text
 * cliLogger.info('Step 2...')  // Updates spinner.text
 *
 * disableSpinnerMode()
 * spinner.succeed('Done!')
 * ```
 */
export function enableSpinnerMode(spinner: Ora): void {
  spinnerWriter.attach(spinner)
  rootLogger.updateConfig({
    outputMode: 'custom',
    outputWriter: spinnerWriter,
  })
  rootLogger.hideTimestamp()
}

/**
 * Disable spinner mode - restore normal console output.
 *
 * Call this before stopping/succeeding the spinner.
 *
 * @returns Array of clean log messages that were displayed during spinner mode
 */
export function disableSpinnerMode(): string[] {
  rootLogger.updateConfig({ outputMode: 'console' })
  rootLogger.showTimestamp()
  return spinnerWriter.detach()
}
