import { Command } from 'commander'
import chalk from 'chalk'
import { confirm, input } from '@inquirer/prompts'
import ora from 'ora'
import type { BotCommand } from './index.js'
import { EnvManager } from '../../packages/bootstrapper/src/index.js'

const cliLogger = {
  info: (msg: string) => console.log(chalk.blue('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✓'), msg),
  error: (msg: string) => console.error(chalk.red('✗'), msg),
  warn: (msg: string) => console.log(chalk.yellow('⚠'), msg),
  title: (msg: string) => console.log(chalk.cyan.bold('\n' + msg + '\n')),
}

interface BotCommandExtended extends BotCommand {
  name: 'bot'
  description: string
  register: (program: Command) => void
}

const command: BotCommandExtended = {
  name: 'bot',
  description: 'Manage multiple bot configurations',

  register(program: Command) {
    const botCmd = program
      .command('bot')
      .description('Manage multiple bot configurations')

    // bot list
    botCmd
      .command('list')
      .description('List all configured bots')
      .action(async () => {
        await handleListBots()
      })

    // bot use
    botCmd
      .command('use')
      .argument('<username>', 'Bot username (without @)')
      .description('Set a bot as active')
      .action(async (username) => {
        await handleUseBot(username)
      })

    // bot info
    botCmd
      .command('info')
      .argument('<username>', 'Bot username (without @)')
      .description('Show detailed information about a bot')
      .action(async (username) => {
        await handleBotInfo(username)
      })

    // bot delete
    botCmd
      .command('delete')
      .argument('<username>', 'Bot username (without @)')
      .option('-f, --force', 'Skip confirmation prompt')
      .description('Delete a bot configuration')
      .action(async (username, options) => {
        await handleDeleteBot(username, options.force)
      })

    // bot migrate
    botCmd
      .command('migrate')
      .description('Migrate old .env.{environment} files to new .envs/ structure')
      .action(async () => {
        await handleMigrateBots()
      })
  },
}

export default command

/**
 * Handle: bot list
 */
async function handleListBots(): Promise<void> {
  cliLogger.title('📋 Configured Bots')

  const envManager = new EnvManager()
  const bots = envManager.listBots()
  const activeBot = envManager.getActiveBot()

  if (bots.length === 0) {
    cliLogger.info('No bots configured yet.')
    cliLogger.info('Create your first bot with: bun run bootstrap')
    return
  }

  console.log('')
  console.log(chalk.bold(`Found ${bots.length} configured bot(s):`))
  console.log('')

  for (const bot of bots) {
    const activeMarker = bot.isActive ? chalk.green('✓ ') : '  '
    const environments = []
    if (bot.hasLocal) environments.push(chalk.cyan('local'))
    if (bot.hasStaging) environments.push(chalk.yellow('staging'))
    if (bot.hasProduction) environments.push(chalk.red('production'))

    console.log(`  ${activeMarker}${chalk.green('@' + bot.username)}`)
    console.log(`      Environments: ${environments.join(', ') || chalk.dim('none')}`)

    if (bot.metadata) {
      console.log(`      Name: ${chalk.cyan(bot.metadata.name)}`)
      console.log(`      Created: ${chalk.dim(new Date(bot.metadata.createdAt).toLocaleDateString())}`)
    }
    console.log('')
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
      console.log(`  - @${bot.username}`)
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
  cliLogger.title(`ℹ️ Bot Information: @${username}`)

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

  console.log('')
  console.log(chalk.bold('Basic Information:'))
  console.log(`  Username: ${chalk.green('@' + bot.username)}`)
  console.log(`  Active: ${bot.isActive ? chalk.green('Yes') : chalk.dim('No')}`)
  console.log('')

  console.log(chalk.bold('Environments:'))
  console.log(`  Local: ${bot.hasLocal ? chalk.green('✓') : chalk.dim('✗')}`)
  console.log(`  Staging: ${bot.hasStaging ? chalk.yellow('✓') : chalk.dim('✗')}`)
  console.log(`  Production: ${bot.hasProduction ? chalk.red('✓') : chalk.dim('✗')}`)
  console.log('')

  if (bot.metadata) {
    console.log(chalk.bold('Metadata:'))
    console.log(`  Name: ${chalk.cyan(bot.metadata.name)}`)
    console.log(`  Created: ${new Date(bot.metadata.createdAt).toLocaleString()}`)
    console.log(`  Updated: ${new Date(bot.metadata.updatedAt).toLocaleString()}`)
    if (bot.metadata.description) {
      console.log(`  Description: ${chalk.dim(bot.metadata.description)}`)
    }
    if (bot.metadata.tags && bot.metadata.tags.length > 0) {
      console.log(`  Tags: ${chalk.cyan(bot.metadata.tags.join(', '))}`)
    }
  }

  // Show environment details
  const environments: Array<{ name: string; value: string }> = []
  if (bot.hasLocal) environments.push({ name: 'local', value: 'LOCAL' })
  if (bot.hasStaging) environments.push({ name: 'staging', value: 'STAGING' })
  if (bot.hasProduction) environments.push({ name: 'production', value: 'PRODUCTION' })

  for (const env of environments) {
    try {
      const config = await envManager.readEnv(username, env.value as any)
      console.log('')
      console.log(chalk.bold(`${env.name.toUpperCase()} Configuration:`))
      if (config.botToken) {
        console.log(`  Token: ${chalk.yellow(config.botToken.slice(0, 10) + '...')}`)
      }
      if (config.controlChatId) {
        console.log(`  Control Chat ID: ${chalk.cyan(config.controlChatId)}`)
      }
      if (config.controlTopicId) {
        console.log(`  Control Topic ID: ${chalk.yellow(String(config.controlTopicId))}`)
      }
      if (config.logChatId) {
        console.log(`  Log Chat ID: ${chalk.cyan(config.logChatId)}`)
      }
      if (config.logTopicId) {
        console.log(`  Log Topic ID: ${chalk.yellow(String(config.logTopicId))}`)
      }
    } catch {
      console.log('')
      console.log(chalk.bold(`${env.name.toUpperCase()} Configuration:`))
      console.log(`  ${chalk.dim('Unable to load configuration')}`)
    }
  }

  console.log('')
}

/**
 * Handle: bot delete <username>
 */
async function handleDeleteBot(username: string, force: boolean): Promise<void> {
  const envManager = new EnvManager()

  if (!envManager.botExists(username)) {
    cliLogger.error(`Bot '@${username}' does not exist`)
    return
  }

  // Check if this is the active bot
  const isActive = envManager.getActiveBot() === username

  // Confirm deletion
  if (!force) {
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
      cliLogger.info('Active bot cleared. Use "bun run bot use <username>" to set a new active bot.')
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
  cliLogger.title('🔄 Migrate Old .env Files')

  console.log('')
  console.log(chalk.dim('This command will migrate old .env.{environment} files'))
  console.log(chalk.dim('to the new .envs/{bot}/{environment}.env structure.'))
  console.log(chalk.dim('Old files will be backed up as .env.{environment}.backup'))
  console.log('')

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
        console.log('')
        console.log(chalk.bold('Migrated bots:'))
        for (const botUsername of result.migrated) {
          console.log(`  ${chalk.green('@' + botUsername)}`)
        }
        console.log('')
      } else {
        console.log('')
        cliLogger.info('No old .env files found to migrate')
        console.log('')
      }
    } else {
      spinner.fail('Migration completed with errors')

      if (result.migrated.length > 0) {
        console.log('')
        console.log(chalk.bold('Successfully migrated:'))
        for (const botUsername of result.migrated) {
          console.log(`  ${chalk.green('@' + botUsername)}`)
        }
      }

      if (result.errors && result.errors.length > 0) {
        console.log('')
        console.log(chalk.bold('Errors:'))
        for (const error of result.errors) {
          console.log(`  ${chalk.red('✗')} ${error}`)
        }
        console.log('')
      }
    }
  } catch (error) {
    spinner.fail('Migration failed')
    if (error instanceof Error) {
      cliLogger.error(error.message)
    }
  }
}
