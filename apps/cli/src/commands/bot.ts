/**
 * Bot management CLI command.
 *
 * Provides subcommands for managing multiple bot configurations.
 *
 * @module
 */

import type { Command } from 'commander'
import { confirm } from '@inquirer/prompts'
import ora from 'ora'
import { EnvManager, type Environment } from 'mks2508/main'
import { cliLogger, printTitle } from '../utils/index.js'

/**
 * Register the bot command with all subcommands.
 *
 * @param program - Commander program instance
 *
 * @example
 * ```typescript
 * import { program } from 'commander'
 * import { registerBotCommand } from './commands/bot.js'
 *
 * registerBotCommand(program)
 * program.parse()
 * ```
 */
export function registerBotCommand(program: Command): void {
  const botCmd = program
    .command('bot')
    .description('Manage multiple bot configurations')

  botCmd
    .command('list')
    .description('List all configured bots')
    .action(handleListBots)

  botCmd
    .command('use')
    .argument('<username>', 'Bot username (without @)')
    .description('Set a bot as active')
    .action(handleUseBot)

  botCmd
    .command('info')
    .argument('<username>', 'Bot username (without @)')
    .description('Show detailed information about a bot')
    .action(handleBotInfo)

  botCmd
    .command('delete')
    .argument('<username>', 'Bot username (without @)')
    .option('-f, --force', 'Skip confirmation prompt')
    .description('Delete a bot configuration')
    .action(handleDeleteBot)

  botCmd
    .command('migrate')
    .description('Migrate old .env.{environment} files to new .envs/ structure')
    .action(handleMigrateBots)
}

/**
 * Handle: bot list
 */
async function handleListBots(): Promise<void> {
  printTitle('📋 Configured Bots')

  const envManager = new EnvManager()
  const bots = envManager.listBots()
  const activeBot = envManager.getActiveBot()

  if (bots.length === 0) {
    cliLogger.info('No bots configured yet.')
    cliLogger.info('Create your first bot with: tbm bootstrap')
    return
  }

  cliLogger.info(`Found ${bots.length} configured bot(s):`)
  cliLogger.info('')

  for (const bot of bots) {
    const activeMarker = bot.isActive ? '✓ ' : '  '
    const environments: string[] = []
    if (bot.hasLocal) environments.push('local')
    if (bot.hasStaging) environments.push('staging')
    if (bot.hasProduction) environments.push('production')

    cliLogger.info(`${activeMarker}@${bot.username}`)
    cliLogger.info(`      Environments: ${environments.join(', ') || 'none'}`)

    if (bot.metadata) {
      cliLogger.info(`      Name: ${bot.metadata.name}`)
      cliLogger.info(`      Created: ${new Date(bot.metadata.createdAt).toLocaleDateString()}`)
    }
    cliLogger.info('')
  }

  cliLogger.success(`Active bot: ${activeBot ? '@' + activeBot : 'none'}`)
}

/**
 * Handle: bot use <username>
 */
async function handleUseBot(username: string): Promise<void> {
  const envManager = new EnvManager()

  if (!envManager.botExists(username)) {
    cliLogger.error(`Bot '@${username}' does not exist`)
    cliLogger.info('Available bots:')
    const bots = envManager.listBots()
    for (const bot of bots) {
      cliLogger.info(`  - @${bot.username}`)
    }
    return
  }

  await envManager.setActiveBot(username)
  cliLogger.success(`@${username} is now the active bot`)
}

/**
 * Handle: bot info <username>
 */
async function handleBotInfo(username: string): Promise<void> {
  printTitle(`ℹ️ Bot Information: @${username}`)

  const envManager = new EnvManager()

  if (!envManager.botExists(username)) {
    cliLogger.error(`Bot '@${username}' does not exist`)
    return
  }

  const bots = envManager.listBots()
  const bot = bots.find((b) => b.username === username)

  if (!bot) {
    cliLogger.error(`Bot '@${username}' not found`)
    return
  }

  cliLogger.info('Basic Information:')
  cliLogger.info(`  Username: @${bot.username}`)
  cliLogger.info(`  Active: ${bot.isActive ? 'Yes' : 'No'}`)
  cliLogger.info('')

  cliLogger.info('Environments:')
  cliLogger.info(`  Local: ${bot.hasLocal ? '✓' : '✗'}`)
  cliLogger.info(`  Staging: ${bot.hasStaging ? '✓' : '✗'}`)
  cliLogger.info(`  Production: ${bot.hasProduction ? '✓' : '✗'}`)
  cliLogger.info('')

  if (bot.metadata) {
    cliLogger.info('Metadata:')
    cliLogger.info(`  Name: ${bot.metadata.name}`)
    cliLogger.info(`  Created: ${new Date(bot.metadata.createdAt).toLocaleString()}`)
    cliLogger.info(`  Updated: ${new Date(bot.metadata.updatedAt ?? bot.metadata.createdAt).toLocaleString()}`)
    if (bot.metadata.description) {
      cliLogger.info(`  Description: ${bot.metadata.description}`)
    }
    if (bot.metadata.tags && bot.metadata.tags.length > 0) {
      cliLogger.info(`  Tags: ${bot.metadata.tags.join(', ')}`)
    }
  }

  const environments: Array<{ name: string; value: Environment }> = []
  if (bot.hasLocal) environments.push({ name: 'local', value: 'local' })
  if (bot.hasStaging) environments.push({ name: 'staging', value: 'staging' })
  if (bot.hasProduction) environments.push({ name: 'production', value: 'production' })

  for (const env of environments) {
    try {
      const config = await envManager.readEnv(username, env.value)
      cliLogger.info('')
      cliLogger.info(`${env.name.toUpperCase()} Configuration:`)
      if (config.botToken) {
        cliLogger.info(`  Token: ${config.botToken.slice(0, 10)}...`)
      }
      if (config.controlChatId) {
        cliLogger.info(`  Control Chat ID: ${config.controlChatId}`)
      }
      if (config.controlTopicId) {
        cliLogger.info(`  Control Topic ID: ${config.controlTopicId}`)
      }
      if (config.logChatId) {
        cliLogger.info(`  Log Chat ID: ${config.logChatId}`)
      }
      if (config.logTopicId) {
        cliLogger.info(`  Log Topic ID: ${config.logTopicId}`)
      }
    } catch {
      cliLogger.info('')
      cliLogger.info(`${env.name.toUpperCase()} Configuration:`)
      cliLogger.info(`  Unable to load configuration`)
    }
  }

  cliLogger.info('')
}

/**
 * Handle: bot delete <username>
 */
async function handleDeleteBot(
  username: string,
  options: { force?: boolean }
): Promise<void> {
  const envManager = new EnvManager()

  if (!envManager.botExists(username)) {
    cliLogger.error(`Bot '@${username}' does not exist`)
    return
  }

  const isActive = envManager.getActiveBot() === username

  if (!options.force) {
    const confirmDelete = await confirm({
      message: `Are you sure you want to delete bot '@${username}'?`,
      default: false,
    })

    if (!confirmDelete) {
      cliLogger.info('Deletion cancelled')
      return
    }
  }

  const spinner = ora({ color: 'cyan' })
  spinner.text = `Deleting bot '@${username}'...`
  spinner.start()

  try {
    await envManager.deleteBot(username)
    spinner.succeed(`Bot '@${username}' deleted`)

    if (isActive) {
      cliLogger.info('Active bot cleared. Use "tbm bot use <username>" to set a new active bot.')
    }
  } catch (error) {
    spinner.fail('Failed to delete bot')
    if (error instanceof Error) {
      cliLogger.error(error.message)
    }
  }
}

/**
 * Handle: bot migrate
 */
async function handleMigrateBots(): Promise<void> {
  printTitle('🔄 Migrate Old .env Files')

  cliLogger.info('This command will migrate old .env.{environment} files')
  cliLogger.info('to the new .envs/{bot}/{environment}.env structure.')
  cliLogger.info('Old files will be backed up as .env.{environment}.backup')
  cliLogger.info('')

  const confirmMigrate = await confirm({
    message: 'Do you want to proceed with migration?',
    default: true,
  })

  if (!confirmMigrate) {
    cliLogger.info('Migration cancelled')
    return
  }

  const spinner = ora({ color: 'cyan' })
  spinner.text = 'Migrating .env files...'
  spinner.start()

  try {
    const envManager = new EnvManager()
    const result = await envManager.migrateOldEnvs()

    if (result.success) {
      spinner.succeed('Migration completed successfully')

      if (result.migrated.length > 0) {
        cliLogger.info('')
        cliLogger.info('Migrated bots:')
        for (const botUsername of result.migrated) {
          cliLogger.info(`  @${botUsername}`)
        }
        cliLogger.info('')
      } else {
        cliLogger.info('')
        cliLogger.info('No old .env files found to migrate')
        cliLogger.info('')
      }
    } else {
      spinner.fail('Migration completed with errors')

      if (result.migrated.length > 0) {
        cliLogger.info('')
        cliLogger.info('Successfully migrated:')
        for (const botUsername of result.migrated) {
          cliLogger.success(`  @${botUsername}`)
        }
      }

      if (result.errors && result.errors.length > 0) {
        cliLogger.info('')
        cliLogger.info('Errors:')
        for (const error of result.errors) {
          cliLogger.error(`  ${error}`)
        }
        cliLogger.info('')
      }
    }
  } catch (error) {
    spinner.fail('Migration failed')
    if (error instanceof Error) {
      cliLogger.error(error.message)
    }
  }
}
