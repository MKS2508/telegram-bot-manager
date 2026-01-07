#!/usr/bin/env bun
/**
 * Telegram Bot Manager CLI
 *
 * Command-line interface for managing Telegram bots via BotFather automation.
 *
 * @module
 */

import { program } from 'commander'

program
  .name('telegram-bot-manager')
  .description('CLI for managing Telegram bots via BotFather automation')
  .version('0.1.0')

// Import commands (will be refactored in Fase 1)
// TODO: Import and register commands after refactoring

program.parse()
