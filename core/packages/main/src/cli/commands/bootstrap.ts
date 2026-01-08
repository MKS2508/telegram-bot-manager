/**
 * Bootstrap command for complete bot setup.
 *
 * Creates bot, group, topics and configures .env files.
 *
 * @module
 */

import type { Command } from 'commander'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { input, confirm, checkbox } from '@inquirer/prompts'
import ora from 'ora'
import { BootstrapClient } from '../../client.js'
import { BotFatherManager } from '../../bot-father/index.js'
import { GroupManager } from '../../group-manager.js'
import { TopicManager } from '../../topic-manager.js'
import { EnvManager } from '../../env-manager.js'
import { BootstrapState } from '../../bootstrap-state.js'
import type { Environment, IForumGroupInfo, IForumTopicInfo } from '../../types/index.js'
import {
  cliLogger,
  printTitle,
  generateRandomUsername,
  generateBotDisplayname,
  generateGroupName,
  sleep,
  updateEnvVar,
  getApiCredentials,
  loadApiCredentialsFromEnv,
} from '../utils/index.js'

/**
 * Bootstrap command options.
 */
interface IBootstrapOptions {
  environment?: 'local' | 'staging' | 'production'
  botName?: string
  botUsername?: string
  groupName?: string
  skipTopics?: boolean
  auto?: boolean
  bot?: string
  list?: boolean
  reuse?: boolean
  force?: boolean
}

/**
 * Bootstrap result with all created resources.
 */
interface IBootstrapResult {
  botToken?: string
  botUsername?: string
  chatId?: number
  controlTopicId?: number
  logTopicId?: number
  configTopicId?: number
  bugsTopicId?: number
  generalTopicId?: number
}

/**
 * Register the bootstrap command.
 *
 * @param program - Commander program instance
 */
export function registerBootstrapCommand(program: Command): void {
  program
    .command('bootstrap')
    .description('Complete bootstrap: Create bot, group, topics, and configure .env')
    .option('-e, --environment <local|staging|production>', 'Target environment', 'local')
    .option('--bot-name <value>', 'Bot display name')
    .option('--bot-username <value>', 'Bot username (must end in "bot")')
    .option('--group-name <value>', 'Group/forum title')
    .option('--skip-topics', 'Skip creating topics', false)
    .option('--auto', 'Use auto-generated names without confirmation', false)
    .option('--bot <value>', 'Target specific bot')
    .option('--list', 'List available bots from BotFather and prompt for import')
    .option('--reuse', 'Reuse existing configuration without prompts')
    .option('--force', 'Force recreate existing configuration')
    .action(handleBootstrap)
}

/**
 * Handle the bootstrap command.
 */
async function handleBootstrap(options: IBootstrapOptions): Promise<void> {
  printTitle('🚀 Complete Bot Bootstrap')

  const environment = (options.environment ?? 'local') as Environment

  const envManager = new EnvManager()
  const bootstrapState = new BootstrapState()

  if (options.list) {
    await handleListBots(options)
    return
  }

  let targetBotUsername = options.bot
  if (targetBotUsername) {
    if (!envManager.botExists(targetBotUsername)) {
      cliLogger.error(`Bot '${targetBotUsername}' does not exist`)
      return
    }
    cliLogger.info(`Targeting existing bot: @${targetBotUsername}`)
  }

  const activeBot = targetBotUsername || envManager.getActiveBot()
  if (activeBot) {
    cliLogger.info(`Active bot: @${activeBot}`)
  }

  const envFile = resolve(process.cwd(), 'core', `.env.${environment}`)
  const useOldEnvStructure = existsSync(envFile)

  if (!activeBot && !useOldEnvStructure) {
    cliLogger.error(`No active bot and environment file not found: ${envFile}`)
    cliLogger.info('Please run "tbm bootstrap" without flags to create a new bot.')
    return
  }

  const { apiId: envApiId, apiHash: envApiHash } = await loadApiCredentialsFromEnv(environment)
  const hasEnvCredentials = !!envApiId && !!envApiHash

  const apiCredentials = await getApiCredentials(hasEnvCredentials, envApiId, envApiHash)
  if (!apiCredentials) {
    cliLogger.error('Failed to get API credentials')
    return
  }

  const spinner = ora({ color: 'cyan' })

  try {
    cliLogger.info('Initializing Telegram client...')

    const client = new BootstrapClient({
      apiId: apiCredentials.apiId,
      apiHash: apiCredentials.apiHash,
    })

    if (apiCredentials.saveToEnv && useOldEnvStructure) {
      cliLogger.info('Saving API credentials to .env...')
      let envContent = await readFile(envFile, 'utf-8')
      envContent = updateEnvVar(envContent, 'TG_API_ID', String(apiCredentials.apiId))
      envContent = updateEnvVar(envContent, 'TG_API_HASH', apiCredentials.apiHash)
      await writeFile(envFile, envContent, 'utf-8')
      cliLogger.success('API credentials saved to .env')
    }

    const isAuthorized = await client.ensureAuthorized()
    if (!isAuthorized) {
      cliLogger.error('Authorization failed')
      return
    }

    cliLogger.success('Connected to Telegram')

    // ========================================
    // PHASE 1: Bot Selection
    // ========================================

    let botToken: string | undefined
    let botUsername: string | undefined
    let botName: string | undefined

    bootstrapState.initialize({
      environment,
      apiId: apiCredentials.apiId,
      apiHash: apiCredentials.apiHash,
    })

    const existingBot = activeBot
      ? await loadExistingBotConfig(activeBot, environment, envManager)
      : null

    const botFather = new BotFatherManager(client)
    const availableBots = await bootstrapState.fetchAvailableBots(client, botFather)

    if (options.reuse && existingBot) {
      cliLogger.info(`Reusing existing bot: @${existingBot.botUsername}`)
      botToken = existingBot.botToken
      botUsername = existingBot.botUsername
    } else if (options.force) {
      cliLogger.info('Force mode: Creating new bot...')
      const newBotResult = await createNewBot(client, botFather, spinner)
      if (!newBotResult.success) {
        return
      }
      botToken = newBotResult.botToken
      botUsername = newBotResult.botUsername
      botName = newBotResult.botName
    } else {
      const configuredBots = envManager.listBots()
      const botSelection = await bootstrapState.promptBotSelection(
        availableBots,
        configuredBots,
        existingBot
      )

      if (botSelection.action === 'cancel') {
        cliLogger.info('Bootstrap cancelled')
        return
      }

      if (botSelection.action === 'reuse') {
        const reuseBotUsername = botSelection.botUsername || existingBot?.botUsername
        if (!reuseBotUsername) {
          cliLogger.error('No bot username selected')
          return
        }
        botUsername = reuseBotUsername

        const botInfo = availableBots.find((b) => b.username === reuseBotUsername)
        if (botInfo?.token) {
          botToken = botInfo.token
        } else if (existingBot?.botToken) {
          botToken = existingBot.botToken
        } else {
          cliLogger.warn('Bot token not found in config, you may need to recreate the bot')
        }
        cliLogger.success(`Reusing bot: @${botUsername}`)
      } else {
        const newBotResult = await createNewBot(client, botFather, spinner, options)
        if (!newBotResult.success) {
          return
        }
        botToken = newBotResult.botToken
        botUsername = newBotResult.botUsername
        botName = newBotResult.botName
      }
    }

    if (!botToken || !botUsername) {
      cliLogger.error('Failed to get bot token or username')
      return
    }

    // ========================================
    // PHASE 2: Group Selection
    // ========================================

    let chatId: number | undefined
    let groupName: string | undefined

    const groupManager = new GroupManager(client)

    const forumsResult = await groupManager.getUserForums()
    const existingGroups: Array<{
      id: number
      title: string
      username?: string
      type: 'supergroup' | 'channel'
      isForum: boolean
      memberCount?: number
    }> =
      forumsResult.success && forumsResult.forums
        ? forumsResult.forums.map((f: IForumGroupInfo) => ({
            id: f.id,
            title: f.title,
            username: f.username,
            type: 'supergroup' as const,
            isForum: f.isForum ?? false,
            memberCount: f.memberCount,
          }))
        : []

    const configuredGroupId = existingBot?.controlChatId
      ? Number(existingBot.controlChatId)
      : null
    if (configuredGroupId) {
      const alreadyInList = existingGroups.find((g) => g.id === configuredGroupId)
      if (!alreadyInList) {
        existingGroups.unshift({
          id: configuredGroupId,
          title: '⭐ Configured Group',
          type: 'supergroup' as const,
          isForum: true,
        })
      } else {
        alreadyInList.title = `⭐ ${alreadyInList.title} (configured)`
      }
    }

    if (options.force) {
      const newGroupResult = await createNewGroup(
        client,
        groupManager,
        spinner,
        botUsername,
        botName,
        options
      )
      if (!newGroupResult.success) {
        return
      }
      chatId = newGroupResult.chatId
      groupName = newGroupResult.groupName
    } else {
      const groupSelection = await bootstrapState.promptGroupSelection(existingGroups)

      if (groupSelection.action === 'skip') {
        cliLogger.info('Skipping group creation')
        chatId = undefined
      } else if (groupSelection.action === 'reuse') {
        chatId = groupSelection.chatId
        groupName = groupSelection.groupInfo?.title
        cliLogger.success(`Reusing group: ${groupName}`)
      } else {
        const newGroupResult = await createNewGroup(
          client,
          groupManager,
          spinner,
          botUsername,
          botName,
          options
        )
        if (!newGroupResult.success) {
          return
        }
        chatId = newGroupResult.chatId
        groupName = newGroupResult.groupName
      }
    }

    // ========================================
    // PHASE 3: Topics Selection
    // ========================================

    const bootstrapResult: IBootstrapResult = {
      botToken,
      botUsername,
      chatId,
    }

    if (chatId && !options.skipTopics) {
      const topicGroupManager = new GroupManager(client)
      const topicsResult = await topicGroupManager.getForumTopics(chatId)
      const existingTopics: Array<{ id: number; name: string; iconColor?: number }> =
        topicsResult.success && topicsResult.topics
          ? topicsResult.topics.map((t: IForumTopicInfo) => ({
              id: t.id,
              name: t.name,
              iconColor: t.iconColor,
            }))
          : []

      const topicsSelection = await bootstrapState.promptTopicsSelection(existingTopics)

      const allTopicNames = ['General', 'Control', 'Logs', 'Config', 'Bugs']
      const topicManager = new TopicManager(botToken)

      const mapTopicToResult = (name: string, id: number) => {
        const topicName = name.toLowerCase()
        if (topicName === 'control') {
          bootstrapResult.controlTopicId = id
        } else if (topicName === 'logs' || topicName === 'log') {
          bootstrapResult.logTopicId = id
        } else if (topicName === 'config') {
          bootstrapResult.configTopicId = id
        } else if (topicName === 'bugs') {
          bootstrapResult.bugsTopicId = id
        } else if (topicName === 'general') {
          bootstrapResult.generalTopicId = id
        }
      }

      if (topicsSelection.action === 'reuse' && topicsSelection.topics) {
        cliLogger.info('Using existing topics')
        for (const topic of topicsSelection.topics) {
          cliLogger.info(`  ${topic.name}: ${topic.id}`)
          mapTopicToResult(topic.name, topic.id)
        }
      } else if (topicsSelection.action === 'create_missing') {
        printTitle('🧵 Step 3: Creating Topics')

        const existingTopicNames = new Set(existingTopics.map((t) => t.name.toLowerCase()))
        const topicsToCreate = allTopicNames.filter(
          (name) => !existingTopicNames.has(name.toLowerCase())
        )

        for (const topic of existingTopics) {
          cliLogger.info(`  ${topic.name}: ${topic.id} (existing)`)
          mapTopicToResult(topic.name, topic.id)
        }

        if (topicsToCreate.length > 0) {
          spinner.text = `Creating ${topicsToCreate.length} new topics...`
          spinner.start()

          const topicResults = await topicManager.createTopics(chatId, topicsToCreate)
          spinner.succeed(`Created ${topicResults.length} new topics`)

          for (const { name, result } of topicResults) {
            if (result.success && result.threadId) {
              cliLogger.info(`  ${name}: ${result.threadId}`)
              mapTopicToResult(name, result.threadId)
            }
          }
        } else {
          cliLogger.info('All required topics already exist')
        }
      } else if (topicsSelection.action === 'recreate_all') {
        printTitle('🧵 Step 3: Recreating Topics')

        const topicsToDelete = existingTopics.filter((t) => t.id !== 1)
        if (topicsToDelete.length > 0) {
          spinner.text = `Deleting ${topicsToDelete.length} topics...`
          spinner.start()

          for (const topic of topicsToDelete) {
            await topicGroupManager.deleteTopic(chatId, topic.id)
          }
          spinner.succeed(`Deleted ${topicsToDelete.length} topics`)
        }

        const hasDefaultGeneral = existingTopics.some((t) => t.id === 1)
        const topicsToCreate = hasDefaultGeneral
          ? allTopicNames.filter((n) => n.toLowerCase() !== 'general')
          : allTopicNames

        if (hasDefaultGeneral) {
          mapTopicToResult('General', 1)
          cliLogger.info(`  General: 1 (default)`)
        }

        if (topicsToCreate.length > 0) {
          spinner.text = `Creating ${topicsToCreate.length} topics...`
          spinner.start()

          const topicResults = await topicManager.createTopics(chatId, topicsToCreate)
          spinner.succeed(`Created ${topicResults.length} topics`)

          for (const { name, result } of topicResults) {
            if (result.success && result.threadId) {
              cliLogger.info(`  ${name}: ${result.threadId}`)
              mapTopicToResult(name, result.threadId)
            }
          }
        }
      } else if (topicsSelection.action === 'delete_duplicates') {
        printTitle('🧵 Step 3: Deleting Duplicates')

        const seen = new Map<string, number>()
        const toDelete: number[] = []

        const sortedTopics = [...existingTopics].sort((a, b) => a.id - b.id)

        for (const topic of sortedTopics) {
          const name = topic.name.toLowerCase()
          if (seen.has(name)) {
            toDelete.push(topic.id)
          } else {
            seen.set(name, topic.id)
          }
        }

        if (toDelete.length > 0) {
          spinner.text = `Deleting ${toDelete.length} duplicate topics...`
          spinner.start()

          for (const topicId of toDelete) {
            if (topicId !== 1) {
              await topicGroupManager.deleteTopic(chatId, topicId)
            }
          }
          spinner.succeed(`Deleted ${toDelete.length} duplicate topics`)
        } else {
          cliLogger.info('No duplicates found')
        }

        for (const [_name, id] of seen.entries()) {
          const originalTopic = existingTopics.find((t) => t.id === id)
          if (originalTopic) {
            cliLogger.info(`  ${originalTopic.name}: ${id}`)
            mapTopicToResult(originalTopic.name, id)
          }
        }
      }
    }

    // ========================================
    // PHASE 4: Update Configuration
    // ========================================

    printTitle('🔧 Step 4: Updating Configuration')
    spinner.text = 'Updating bot configuration...'
    spinner.start()

    await envManager.updateEnv(botUsername, environment, {
      botToken: bootstrapResult.botToken,
      controlChatId: bootstrapResult.chatId ? String(bootstrapResult.chatId) : undefined,
      controlTopicId: bootstrapResult.controlTopicId,
      logChatId: bootstrapResult.chatId ? String(bootstrapResult.chatId) : undefined,
      logTopicId: bootstrapResult.logTopicId,
    })

    const currentActive = envManager.getActiveBot()
    if (currentActive !== botUsername) {
      await envManager.setActiveBot(botUsername)
    }

    spinner.succeed(`Configuration saved for @${botUsername}`)

    // Summary
    printTitle('✅ Bootstrap Complete')

    cliLogger.info('Bot Information:')
    cliLogger.success(`  Username: @${botUsername}`)
    cliLogger.info(`  Token: ${botToken.slice(0, 10)}...`)
    cliLogger.info(`  Environment: ${environment}`)
    cliLogger.info('')

    if (chatId) {
      cliLogger.info('Group Information:')
      cliLogger.info(`  Name: ${groupName || 'Unknown'}`)
      cliLogger.info(`  Chat ID: ${chatId}`)
      cliLogger.info('')
    }

    if (bootstrapResult.controlTopicId || bootstrapResult.logTopicId) {
      cliLogger.info('Topic IDs:')
      if (bootstrapResult.generalTopicId)
        cliLogger.info(`  General: ${bootstrapResult.generalTopicId}`)
      if (bootstrapResult.controlTopicId)
        cliLogger.info(`  Control: ${bootstrapResult.controlTopicId}`)
      if (bootstrapResult.logTopicId) cliLogger.info(`  Logs: ${bootstrapResult.logTopicId}`)
      if (bootstrapResult.configTopicId)
        cliLogger.info(`  Config: ${bootstrapResult.configTopicId}`)
      if (bootstrapResult.bugsTopicId) cliLogger.info(`  Bugs: ${bootstrapResult.bugsTopicId}`)
      cliLogger.info('')
    }

    cliLogger.success('Your bot is now ready to use!')
    cliLogger.info('')
    cliLogger.info('Configuration saved to:')
    cliLogger.info(`  core/.envs/${botUsername}/${environment}.env`)
    cliLogger.info('')
    cliLogger.info('Next steps:')
    cliLogger.info('  1. Run: bun run dev')
    cliLogger.info(`  2. Send /start to @${botUsername} in Telegram`)
    cliLogger.info('')

    await client.disconnect()
  } catch (error) {
    spinner.stop()
    cliLogger.error('Bootstrap failed')
    if (error instanceof Error) {
      cliLogger.error(`  ${error.message}`)
    }
  }
}

/**
 * Handle --list flag: Show available bots from BotFather.
 */
async function handleListBots(options: IBootstrapOptions): Promise<void> {
  printTitle('📋 Bots from BotFather')

  const environment = (options.environment ?? 'local') as Environment
  const envManager = new EnvManager()

  const { apiId, apiHash } = await loadApiCredentialsFromEnv(environment)

  let finalApiId: number
  let finalApiHash: string

  if (apiId && apiHash) {
    cliLogger.success('Found API credentials in environment file')
    finalApiId = parseInt(apiId, 10)
    finalApiHash = apiHash
  } else {
    cliLogger.info('API credentials not found in environment files')

    const inputApiId = await input({
      message: 'Enter your API ID:',
      validate: (value: string) => {
        const num = parseInt(value, 10)
        if (isNaN(num)) return 'API ID must be a number'
        return true
      },
    })

    const inputApiHash = await input({
      message: 'Enter your API Hash:',
      validate: (value: string) => {
        if (!value || value.trim().length < 32) {
          return 'API Hash seems too short (should be 32+ characters)'
        }
        return true
      },
    })

    finalApiId = parseInt(inputApiId, 10)
    finalApiHash = inputApiHash.trim()

    const saveCredentials = await confirm({
      message: 'Save API credentials to .env file for future use?',
      default: true,
    })

    if (saveCredentials) {
      const envFile = resolve(process.cwd(), 'core', `.env.${environment}`)
      let envContent = ''

      if (existsSync(envFile)) {
        envContent = await readFile(envFile, 'utf-8')
      }

      envContent = updateEnvVar(envContent, 'TG_API_ID', String(finalApiId))
      envContent = updateEnvVar(envContent, 'TG_API_HASH', finalApiHash)
      await writeFile(envFile, envContent, 'utf-8')
      cliLogger.success(`API credentials saved to core/.env.${environment}`)
    }
  }

  const spinner = ora({ color: 'cyan' })
  spinner.text = 'Connecting to Telegram...'
  spinner.start()

  const logLevel = process.env.LOG_LEVEL || 'info'
  const shouldMuteGramJS = logLevel !== 'debug'

  let client: BootstrapClient | null = null

  try {
    client = new BootstrapClient({
      apiId: finalApiId,
      apiHash: finalApiHash,
    })

    const isAuthorized = await client.ensureAuthorized({ muteLogs: shouldMuteGramJS })
    if (!isAuthorized) {
      spinner.fail('Authorization failed')
      return
    }

    spinner.succeed('Connected to Telegram')

    if (shouldMuteGramJS) {
      client.muteLogs()
    }

    const botFather = new BotFatherManager(client)

    spinner.text = 'Fetching bots from BotFather...'
    spinner.start()

    const botsWithTokens = await botFather.getAllBotsWithTokens({
      onProgress: (msg) => {
        spinner.text = msg
      },
    })

    spinner.succeed(`Found ${botsWithTokens.length} bot(s)`)

    if (shouldMuteGramJS) {
      client.unmuteLogs()
    }

    if (botsWithTokens.length === 0) {
      cliLogger.info('No bots found. Create your first bot with: tbm bootstrap')
      await client.disconnect()
      return
    }

    cliLogger.info('')
    cliLogger.success(`Found ${botsWithTokens.length} bot(s):`)
    cliLogger.info('')

    for (const bot of botsWithTokens) {
      const alreadyConfigured = envManager.botExists(bot.username)
      const statusText = alreadyConfigured ? ' (already configured)' : ''
      cliLogger.info(`  @${bot.username} - ${bot.name}${statusText}`)
    }

    cliLogger.info('')

    const wantsToImport = await confirm({
      message: 'Do you want to import any of these bots?',
      default: true,
    })

    if (!wantsToImport) {
      cliLogger.info('Import cancelled')
      await client.disconnect()
      return
    }

    const availableBots = botsWithTokens.filter((bot) => !envManager.botExists(bot.username))

    if (availableBots.length === 0) {
      cliLogger.info('All bots are already configured')
      await client.disconnect()
      return
    }

    let botsToImport: Array<{ username: string; name: string; token: string }>

    if (availableBots.length === 1) {
      const singleBot = availableBots[0]!
      const importSingle = await confirm({
        message: `Import @${singleBot.username}?`,
        default: true,
      })

      if (!importSingle) {
        cliLogger.info('Import cancelled')
        await client.disconnect()
        return
      }

      botsToImport = [singleBot]
    } else {
      const importMode = await confirm({
        message: `Import all ${availableBots.length} available bots?`,
        default: false,
      })

      if (importMode) {
        botsToImport = availableBots
      } else {
        const selected = await checkbox({
          message: 'Select bots to import (space to select, enter to continue):',
          choices: availableBots.map((bot) => ({
            name: `@${bot.username} - ${bot.name}`,
            value: bot,
            checked: false,
          })),
        })

        if (selected.length === 0) {
          cliLogger.info('No bots selected')
          await client.disconnect()
          return
        }

        botsToImport = selected
      }
    }

    cliLogger.info('')
    printTitle('📦 Importing Bots')

    let imported = 0
    let failed = 0

    for (const bot of botsToImport) {
      spinner.text = `Creating config for @${bot.username}...`
      spinner.start()

      try {
        await envManager.createEnv(bot.username, environment, {
          botToken: bot.token,
          mode: 'polling',
        })

        spinner.succeed(`Created config for @${bot.username}`)
        imported++
      } catch {
        spinner.fail(`Failed to create config for @${bot.username}`)
        failed++
      }
    }

    const currentActive = envManager.getActiveBot()
    if (!currentActive && botsToImport.length > 0) {
      const firstBot = botsToImport[0]
      if (firstBot) {
        await envManager.setActiveBot(firstBot.username)
        cliLogger.success(`Set @${firstBot.username} as active bot`)
      }
    }

    cliLogger.info('')
    const configuredBots = envManager.listBots()

    if (configuredBots.length > 0) {
      cliLogger.info('Configured bots:')
      cliLogger.info('')

      for (const bot of configuredBots) {
        const activeMarker = bot.isActive ? '✓ ' : '  '
        const environments: string[] = []
        if (bot.hasLocal) environments.push('local')
        if (bot.hasStaging) environments.push('staging')
        if (bot.hasProduction) environments.push('production')

        cliLogger.info(`  ${activeMarker}@${bot.username}`)
        cliLogger.info(`      Environments: ${environments.join(', ')}`)
      }
      cliLogger.info('')
    }

    cliLogger.info('')
    printTitle('✅ Import Complete')
    cliLogger.info('')
    cliLogger.info('Summary:')
    cliLogger.success(`  Imported: ${imported}`)
    if (failed > 0) {
      cliLogger.error(`  Failed: ${failed}`)
    }
    cliLogger.info('')

    if (imported > 0) {
      cliLogger.success('Bots imported successfully!')
      cliLogger.info('Configuration saved to:')
      for (const bot of botsToImport) {
        if (!envManager.botExists(bot.username)) continue
        cliLogger.info(`  core/.envs/${bot.username}/${environment}.env`)
      }
      cliLogger.info('')
      cliLogger.info('Next steps:')
      cliLogger.info('  1. Run: bun run dev')
      cliLogger.info('  2. Send /start to your bot in Telegram')
      cliLogger.info('  3. Run: tbm bot list to see all configured bots')
      cliLogger.info('')
    }

    await client.disconnect()
  } catch (error) {
    spinner.stop()
    if (shouldMuteGramJS && client) {
      try {
        client.unmuteLogs()
      } catch {
        // Ignore
      }
    }
    cliLogger.error('Failed to fetch bots')
    if (error instanceof Error) {
      cliLogger.error(`  ${error.message}`)
    }
  } finally {
    if (shouldMuteGramJS && client !== null) {
      try {
        client.unmuteLogs()
      } catch {
        // Ignore
      }
    }
  }
}

/**
 * Load existing bot configuration from EnvManager.
 */
async function loadExistingBotConfig(
  botUsername: string,
  environment: Environment,
  envManager: EnvManager
): Promise<{
  botUsername: string
  botToken: string
  environment: Environment
  controlChatId?: string
  controlTopicId?: number
  logChatId?: string
  logTopicId?: number
} | null> {
  try {
    const config = await envManager.readEnv(botUsername, environment)
    if (!config.botToken) {
      return null
    }

    return {
      botUsername,
      botToken: config.botToken,
      environment,
      controlChatId: config.controlChatId,
      controlTopicId: config.controlTopicId,
      logChatId: config.logChatId,
      logTopicId: config.logTopicId,
    }
  } catch {
    return null
  }
}

/**
 * Create a new bot with prompts.
 */
async function createNewBot(
  _client: BootstrapClient,
  botFather: BotFatherManager,
  spinner: ReturnType<typeof ora>,
  options?: IBootstrapOptions
): Promise<
  | { success: true; botToken: string; botUsername: string; botName: string }
  | { success: false; error?: string }
> {
  let botName: string
  let botUsername: string

  if (options?.botName || options?.botUsername) {
    botName = options.botName ?? (await input({ message: 'Enter bot display name:' }))
    botUsername =
      options.botUsername ??
      (await input({
        message: 'Enter bot username (must end in "bot"):',
        validate: (value: string) => {
          if (!value.endsWith('bot')) {
            return 'Username must end with "bot"'
          }
          return true
        },
      }))
  } else if (options?.auto) {
    botUsername = generateRandomUsername()
    botName = generateBotDisplayname(botUsername)
    cliLogger.info(`Auto-generated bot name: ${botName}`)
    cliLogger.info(`Auto-generated username: @${botUsername}`)
  } else {
    botUsername = generateRandomUsername()
    botName = generateBotDisplayname(botUsername)

    cliLogger.info(`Generated bot name: ${botName}`)
    cliLogger.info(`Generated username: @${botUsername}`)
    cliLogger.info('')

    const useGenerated = await confirm({
      message: 'Use these auto-generated names?',
      default: true,
    })

    if (!useGenerated) {
      botName = await input({ message: 'Enter bot display name:' })
      botUsername = await input({
        message: 'Enter bot username (must end in "bot"):',
        validate: (value: string) => {
          if (!value.endsWith('bot')) {
            return 'Username must end with "bot"'
          }
          return true
        },
      })
    }
  }

  printTitle('🤖 Step 1: Creating Bot')
  spinner.text = 'Creating bot via @BotFather...'
  spinner.start()

  const botResult = await botFather.createBot({
    botName,
    botUsername: botUsername!,
  })

  if (!botResult.success || !botResult.botToken) {
    spinner.fail('Failed to create bot')
    return { success: false, error: botResult.error }
  }

  spinner.succeed(`Bot created: @${botResult.botUsername}`)
  return {
    success: true,
    botToken: botResult.botToken,
    botUsername: botResult.botUsername!,
    botName,
  }
}

/**
 * Create a new group with prompts.
 */
async function createNewGroup(
  _client: BootstrapClient,
  groupManager: GroupManager,
  spinner: ReturnType<typeof ora>,
  botUsername: string | undefined,
  botName: string | undefined,
  options?: IBootstrapOptions
): Promise<
  { success: true; chatId: number; groupName: string } | { success: false; error?: string }
> {
  let groupName: string

  if (options?.groupName) {
    groupName = options.groupName
  } else if (options?.auto) {
    groupName = generateGroupName(botName || 'My Bot')
    cliLogger.info(`Auto-generated group name: ${groupName}`)
  } else {
    groupName = generateGroupName(botName || 'My Bot')
    cliLogger.info(`Generated group name: ${groupName}`)

    const useGeneratedGroup = await confirm({
      message: `Use group name "${groupName}"?`,
      default: true,
    })

    if (!useGeneratedGroup) {
      groupName = await input({
        message: 'Enter group/forum title:',
        default: `${botName || 'My Bot'} Control`,
      })
    }
  }

  printTitle('💬 Step 2: Creating Group/Forum')
  spinner.text = 'Creating supergroup with forum mode...'
  spinner.start()

  const groupResult = await groupManager.createSupergroup({
    title: groupName,
    forumMode: true,
  })

  if (!groupResult.success || !groupResult.chatId) {
    spinner.fail('Failed to create group')
    return { success: false, error: groupResult.error }
  }

  spinner.succeed(`Group created: ${groupName} (ID: ${groupResult.chatId})`)

  spinner.text = 'Adding bot as admin...'
  spinner.start()

  await sleep(2000)

  const adminResult = await groupManager.addBotAsAdmin(groupResult.chatId, botUsername!, {
    canManageTopics: true,
    canDeleteMessages: true,
    canEditMessages: false,
    canInviteUsers: true,
  })

  if (!adminResult.success) {
    spinner.warn('Failed to add bot as admin (you may need to do this manually)')
    cliLogger.warn(`Please add @${botUsername} as admin in the group`)
  } else {
    spinner.succeed('Bot added as admin')
  }

  return {
    success: true,
    chatId: groupResult.chatId,
    groupName,
  }
}
