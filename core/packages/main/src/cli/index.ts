#!/usr/bin/env node
/**
 * Telegram Bot Manager CLI
 *
 * Command-line interface for managing Telegram bots via BotFather automation.
 *
 * @module
 */

import { program } from 'commander'
import { registerBootstrapCommand } from './commands/bootstrap.js'
import { registerBotCommand } from './commands/bot.js'
import { registerTopicsCommand } from './commands/topics.js'
import { registerConfigureCommand } from './commands/configure.js'

program
  .name('telegram-bot-manager')
  .description('CLI for managing Telegram bots via BotFather automation')
  .version('0.1.0')

registerBootstrapCommand(program)
registerBotCommand(program)
registerTopicsCommand(program)
registerConfigureCommand(program)

program.parse()
