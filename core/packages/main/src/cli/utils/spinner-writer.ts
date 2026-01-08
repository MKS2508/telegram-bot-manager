/**
 * SpinnerWriter - Custom OutputWriter for ora spinner integration.
 *
 * Routes better-logger output to ora spinner text for seamless CLI progress feedback.
 *
 * @module
 */

import type { Ora } from 'ora'

/**
 * Custom OutputWriter that routes logs to ora spinner.
 *
 * Features:
 * - Updates spinner.text with log messages
 * - Strips timestamps and ANSI codes for clean spinner output
 * - Buffers logs to show after spinner completes
 *
 * @example
 * ```typescript
 * import ora from 'ora'
 * import { spinnerWriter, cliLogger } from './utils/index.js'
 *
 * const spinner = ora('Loading...').start()
 * spinnerWriter.attach(spinner)
 * cliLogger.updateConfig({ outputMode: 'custom', outputWriter: spinnerWriter })
 *
 * cliLogger.info('Processing item 1...')  // Updates spinner.text
 * cliLogger.info('Processing item 2...')  // Updates spinner.text
 *
 * cliLogger.updateConfig({ outputMode: 'console' })
 * spinnerWriter.detach()
 * spinner.succeed('Done!')
 * ```
 */
export class SpinnerWriter {
  private spinner: Ora | null = null
  private buffer: string[] = []

  /**
   * Attach an ora spinner for routing logs.
   *
   * @param spinner - The ora spinner instance
   */
  attach(spinner: Ora): void {
    this.spinner = spinner
    this.buffer = []
  }

  /**
   * Detach the spinner and return buffered logs.
   *
   * @returns Array of clean log messages that were displayed
   */
  detach(): string[] {
    this.spinner = null
    const logs = [...this.buffer]
    this.buffer = []
    return logs
  }

  /**
   * Check if a spinner is currently attached.
   */
  get isAttached(): boolean {
    return this.spinner !== null
  }

  /**
   * Strip ANSI codes, timestamps, and badges from message.
   *
   * @param message - Raw log message with formatting
   * @returns Clean message suitable for spinner text
   */
  private cleanMessage(message: string): string {
    // eslint-disable-next-line no-control-regex
    const ansiRegex = /\x1b\[[0-9;]*m/g
    return message
      .replace(ansiRegex, '') // ANSI escape codes
      .replace(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s*/, '') // ISO timestamps
      .replace(/\[\d{2}:\d{2}:\d{2}\]\s*/, '') // Time-only timestamps
      .replace(/⦗[^⦘]+⦘\s*/g, '') // Component badges ⦗CLI⦘
      .replace(/\[INFO\]\s*/gi, '') // Log level badges
      .replace(/\[DEBUG\]\s*/gi, '')
      .replace(/\[WARN\]\s*/gi, '')
      .replace(/\[ERROR\]\s*/gi, '')
      .replace(/\[SUCCESS\]\s*/gi, '')
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim()
  }

  /**
   * Write a log entry - routes to spinner.text if attached.
   *
   * @param message - Formatted log message
   * @param level - Log level (info, warn, error, etc.)
   * @param styles - CSS styles (for browser console, ignored in CLI)
   */
  write(message: string, _level: string, _styles: string[]): void {
    const cleanMsg = this.cleanMessage(message)

    if (this.spinner && cleanMsg) {
      this.spinner.text = cleanMsg
      this.buffer.push(cleanMsg)
    }
  }
}

/**
 * Singleton SpinnerWriter instance for CLI usage.
 */
export const spinnerWriter = new SpinnerWriter()
