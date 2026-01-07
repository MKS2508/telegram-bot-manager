/**
 * Configure command for setting bot properties via BotFather.
 *
 * @module
 */

import type { Command } from 'commander'
import { input } from '@inquirer/prompts'
import ora from 'ora'
import {
  BootstrapClient,
  BotFatherManager,
  EnvManager,
  getDefaultCommands,
  loadCommandsConfig,
} from 'mks2508/main'
import {
  cliLogger,
  printTitle,
  getApiCredentials,
  loadApiCredentialsFromEnv,
} from '../utils/index.js'

/**
 * Register the configure command with all subcommands.
 *
 * @param program - Commander program instance
 */
export function registerConfigureCommand(program: Command): void {
  const configureCmd = program
    .command('configure')
    .description('Configure bot properties via BotFather')

  configureCmd
    .command('commands')
    .argument('<username>', 'Bot username (without @)')
    .option('-f, --file <path>', 'Path to commands JSON file')
    .description('Set bot commands via BotFather')
    .action(handleSetCommands)

  configureCmd
    .command('description')
    .argument('<username>', 'Bot username (without @)')
    .argument('[text]', 'Description text')
    .description('Set bot description via BotFather')
    .action(handleSetDescription)

  configureCmd
    .command('about')
    .argument('<username>', 'Bot username (without @)')
    .argument('[text]', 'About text')
    .description('Set bot about text via BotFather')
    .action(handleSetAbout)

  configureCmd
    .command('name')
    .argument('<username>', 'Bot username (without @)')
    .argument('[name]', 'Display name')
    .description('Set bot display name via BotFather')
    .action(handleSetName)
}

/**
 * Create a connected client with API credentials.
 */
async function createClient(): Promise<BootstrapClient | null> {
  const { apiId, apiHash } = await loadApiCredentialsFromEnv('local')
  const hasEnvCredentials = !!apiId && !!apiHash

  const credentials = await getApiCredentials(hasEnvCredentials, apiId, apiHash)
  if (!credentials) {
    return null
  }

  const client = new BootstrapClient({
    apiId: credentials.apiId,
    apiHash: credentials.apiHash,
  })

  const isAuthorized = await client.ensureAuthorized()
  if (!isAuthorized) {
    cliLogger.error('Authorization failed')
    return null
  }

  return client
}

/**
 * Handle: configure commands <username>
 */
async function handleSetCommands(
  username: string,
  options: { file?: string }
): Promise<void> {
  printTitle(`⚙️ Set Commands for @${username}`)

  const envManager = new EnvManager()
  if (!envManager.botExists(username)) {
    cliLogger.warn(`Bot '@${username}' is not configured locally, but will try anyway`)
  }

  let commands = getDefaultCommands()

  if (options.file) {
    const loadResult = loadCommandsConfig(options.file)
    if (loadResult) {
      commands = loadResult.commands
      cliLogger.success(`Loaded ${commands.length} commands from ${options.file}`)
    } else {
      cliLogger.error(`Failed to load commands from ${options.file}`)
      cliLogger.info('Using default commands instead')
    }
  }

  cliLogger.info('Commands to set:')
  for (const cmd of commands) {
    cliLogger.info(`  /${cmd.command} - ${cmd.description}`)
  }
  cliLogger.info('')

  const client = await createClient()
  if (!client) {
    return
  }

  const spinner = ora({ color: 'cyan' })
  spinner.text = 'Setting bot commands via BotFather...'
  spinner.start()

  try {
    const botFather = new BotFatherManager(client)
    const result = await botFather.setCommands(username, commands)

    if (result.success) {
      spinner.succeed('Commands set successfully!')
    } else {
      spinner.fail('Failed to set commands')
      cliLogger.error(result.error ?? 'Unknown error')
    }

    await client.disconnect()
  } catch (error) {
    spinner.fail('Failed to set commands')
    if (error instanceof Error) {
      cliLogger.error(error.message)
    }
    await client.disconnect()
  }
}

/**
 * Handle: configure description <username> [text]
 */
async function handleSetDescription(
  username: string,
  text?: string
): Promise<void> {
  printTitle(`📝 Set Description for @${username}`)

  let description = text
  if (!description) {
    description = await input({
      message: 'Enter bot description:',
      validate: (value: string) => {
        if (!value || value.trim().length === 0) {
          return 'Description is required'
        }
        if (value.length > 512) {
          return 'Description must be 512 characters or less'
        }
        return true
      },
    })
  }

  const client = await createClient()
  if (!client) {
    return
  }

  const spinner = ora({ color: 'cyan' })
  spinner.text = 'Setting bot description via BotFather...'
  spinner.start()

  try {
    const botFather = new BotFatherManager(client)
    const result = await botFather.setDescription(username, description)

    if (result.success) {
      spinner.succeed('Description set successfully!')
    } else {
      spinner.fail('Failed to set description')
      cliLogger.error(result.error ?? 'Unknown error')
    }

    await client.disconnect()
  } catch (error) {
    spinner.fail('Failed to set description')
    if (error instanceof Error) {
      cliLogger.error(error.message)
    }
    await client.disconnect()
  }
}

/**
 * Handle: configure about <username> [text]
 */
async function handleSetAbout(
  username: string,
  text?: string
): Promise<void> {
  printTitle(`ℹ️ Set About Text for @${username}`)

  let aboutText = text
  if (!aboutText) {
    aboutText = await input({
      message: 'Enter bot about text:',
      validate: (value: string) => {
        if (!value || value.trim().length === 0) {
          return 'About text is required'
        }
        if (value.length > 120) {
          return 'About text must be 120 characters or less'
        }
        return true
      },
    })
  }

  const client = await createClient()
  if (!client) {
    return
  }

  const spinner = ora({ color: 'cyan' })
  spinner.text = 'Setting bot about text via BotFather...'
  spinner.start()

  try {
    const botFather = new BotFatherManager(client)
    const result = await botFather.setAboutText(username, aboutText)

    if (result.success) {
      spinner.succeed('About text set successfully!')
    } else {
      spinner.fail('Failed to set about text')
      cliLogger.error(result.error ?? 'Unknown error')
    }

    await client.disconnect()
  } catch (error) {
    spinner.fail('Failed to set about text')
    if (error instanceof Error) {
      cliLogger.error(error.message)
    }
    await client.disconnect()
  }
}

/**
 * Handle: configure name <username> [name]
 */
async function handleSetName(
  username: string,
  name?: string
): Promise<void> {
  printTitle(`✏️ Set Display Name for @${username}`)

  let displayName = name
  if (!displayName) {
    displayName = await input({
      message: 'Enter bot display name:',
      validate: (value: string) => {
        if (!value || value.trim().length === 0) {
          return 'Display name is required'
        }
        if (value.length > 64) {
          return 'Display name must be 64 characters or less'
        }
        return true
      },
    })
  }

  const client = await createClient()
  if (!client) {
    return
  }

  const spinner = ora({ color: 'cyan' })
  spinner.text = 'Setting bot display name via BotFather...'
  spinner.start()

  try {
    const botFather = new BotFatherManager(client)
    const result = await botFather.setName(username, displayName)

    if (result.success) {
      spinner.succeed('Display name set successfully!')
    } else {
      spinner.fail('Failed to set display name')
      cliLogger.error(result.error ?? 'Unknown error')
    }

    await client.disconnect()
  } catch (error) {
    spinner.fail('Failed to set display name')
    if (error instanceof Error) {
      cliLogger.error(error.message)
    }
    await client.disconnect()
  }
}
