import { Command } from 'commander'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { resolve } from 'path'
import chalk from 'chalk'
import { input, confirm, checkbox } from '@inquirer/prompts'
import ora from 'ora'
import type { BotCommand } from './index.js'
import {
  BootstrapClient,
  BotFatherManager,
  GroupManager,
  TopicManager,
  EnvManager,
  BootstrapState,
  Environment,
  type CreateSupergroupOptions,
} from '../../packages/bootstrapper/src/index.js'

// 🎭 Generador de nombres temáticos
const THEME_GENERATORS = {
  // Prefixes de hacking/cyberpunk
  prefixes: [
    'Cyber', 'Dark', 'Ghost', 'Shadow', 'Crypto', 'Stealth', 'Hack', 'Zero',
    'Null', 'Void', 'Root', 'Shell', 'Code', 'Bit', 'Byte', 'Pixel', 'Glitch',
    'Matrix', 'Neural', 'Quantum', 'Digital', 'Binary', 'Hex', 'Octal',
    'Phantom', 'Specter', 'Wraith', 'Reaper', 'Nexus', 'Core', 'Flux',
    'Pulse', 'Wave', 'Signal', 'Noise', 'Data', 'Net', 'Web', 'Cloud',
    'Proxy', 'Tunnel', 'Gateway', 'Router', 'Switch', 'Hub', 'Node',
    'Elite', 'Prime', 'Ultra', 'Mega', 'Giga', 'Tera', 'Peta', 'Exa',
  ],

  // Strains de cannabis
  strains: [
    'Kush', 'Haze', 'Diesel', 'Skunk', 'Widow', 'Dream', 'Crush', 'Punch',
    'Gelato', 'Cookies', 'Cake', 'Pie', 'Sherbet', 'Sorbet', 'Mint',
    'Berry', 'Cherry', 'Lemon', 'Lime', 'Orange', 'Grape', 'Mango',
    'Pineapple', 'Apple', 'Banana', 'Strawberry', 'Blueberry', 'Raspberry',
    'Purple', 'Blue', 'Green', 'White', 'Black', 'Red', 'Yellow', 'Gold',
    'Silver', 'Platinum', 'Diamond', 'Crystal', 'Amber', 'Ruby', 'Emerald',
    'Sapphire', 'Topaz', 'Onyx', 'Jade', 'Pearl', 'Coral', 'Ivory',
    'Northern', 'Southern', 'Eastern', 'Western', 'Central', 'Arctic',
    'Tropical', 'Alpine', 'Sahara', 'Aurora', 'Cosmic', 'Lunar', 'Solar',
    'Stardust', 'Nebula', 'Galaxy', 'Comet', 'Asteroid', 'Meteor', 'Orbit',
    'Rocket', 'Shuttle', 'Cruiser', 'Falcon', 'Eagle', 'Hawk', 'Raven',
    'Wolf', 'Bear', 'Lion', 'Tiger', 'Dragon', 'Phoenix', 'Griffin',
  ],

  // Tipos de extractos
  extracts: [
    'Hash', 'Rosin', 'Shatter', 'Wax', 'Oil', 'Butter', 'Crumble', 'Live',
    'Resin', 'Sauce', 'Diamonds', 'Badder', 'Batter', 'Sugar', 'Honey',
    'Jelly', 'Jam', 'Bubble', 'Melt', 'Ice', 'Dry', 'Sift', 'Water',
    'Solvent', 'Solventless', 'Press', 'Cure', 'Caviar', 'Moonrocks',
    'Rick', 'Simpson', 'RSO', 'FECO', 'Distillate', 'Isolate', 'Broad',
    'Full', 'Spectrum', 'Terpene', 'Flavonoid', 'Cannabinoid', 'CBD',
    'THC', 'Delta', 'HHC', 'THCO', 'THCP', 'THCV', 'CBG', 'CBN',
  ],

  // Sufijos tecnológicos
  suffixes: [
    'Bot', 'Master', 'King', 'Lord', 'God', 'Father', 'System', 'Core',
    'Hub', 'Node', 'Gate', 'Port', 'Host', 'Server', 'Client', 'Agent',
    'Proxy', 'Shell', 'Root', 'Admin', 'User', 'Daemon', 'Service',
  ],

  // Referencias a Mr Robot / Hackerman
  hackerman: [
    'Elliot', 'Alderson', 'MrRobot', 'Fsociety', 'Darlene', 'Angela',
    'Tyrell', 'Wellick', 'Whiterose', 'Price', 'Ecorp', 'Ecoin',
    'Cisco', 'Roman', 'Letcher', 'Krista', 'Gideon', 'Allsafe',
    'Hackerman', 'Hacker', 'Cracker', 'Script', 'Kiddie', 'Newbie',
    'Exploit', 'Payload', 'Shellcode', 'Backdoor', 'Rootkit', 'Keylogger',
    'Malware', 'Spyware', 'Ransomware', 'Botnet', 'Zombie', 'Drone',
  ],
}

function generateRandomUsername(): string {
  const { prefixes, strains, extracts } = THEME_GENERATORS

  // Elegir patrón aleatorio
  const patterns = [
    // Prefix + Extract (ej: CyberHash, GhostRosin)
    () => {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
      const extract = extracts[Math.floor(Math.random() * extracts.length)]
      return `${prefix}${extract}`.toLowerCase()
    },
    // Prefix + Strain (ej: DarkKush, QuantumHaze)
    () => {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
      const strain = strains[Math.floor(Math.random() * strains.length)]
      return `${prefix}${strain}`.toLowerCase()
    },
    // Strain + Extract (ej: KushHash, HazeRosin)
    () => {
      const strain = strains[Math.floor(Math.random() * strains.length)]
      const extract = extracts[Math.floor(Math.random() * extracts.length)]
      return `${strain}${extract}`.toLowerCase()
    },
    // Prefix + Hackerman (ej: CyberElliot, GhostFsociety)
    () => {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
      const hack = THEME_GENERATORS.hackerman[Math.floor(Math.random() * THEME_GENERATORS.hackerman.length)]
      return `${prefix}${hack}`.toLowerCase()
    },
    // Extract + Hackerman (ej: HashRobot, RosinElliot)
    () => {
      const extract = extracts[Math.floor(Math.random() * extracts.length)]
      const hack = THEME_GENERATORS.hackerman[Math.floor(Math.random() * THEME_GENERATORS.hackerman.length)]
      return `${extract}${hack}`.toLowerCase()
    },
  ]

  const pattern = patterns[Math.floor(Math.random() * patterns.length)]!
  const baseName = pattern()

  // Agregar número aleatorio si es muy corto
  let username = baseName
  if (username.length < 8) {
    username += Math.floor(Math.random() * 999)
  }

  return `${username}bot`
}

function generateBotDisplayname(username: string): string {
  // Convertir username a display name (quitar 'bot' y capitalizar)
  const base = username.replace(/bot$/, '')
  return base
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/(\d+)/g, ' $1')
    .trim() + ' Bot'
}

function generateGroupName(botName: string): string {
  const { prefixes, strains } = THEME_GENERATORS

  const suffixes = [
    'HQ', 'Hub', 'Central', 'Command', 'Control', 'Ops', 'Lab', 'Den',
    'Lair', 'Base', 'Station', 'Network', 'Systems', 'Solutions', 'Tech',
  ]

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const strain = strains[Math.floor(Math.random() * strains.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]

  return `${prefix}${strain} ${suffix}`
}

const cliLogger = {
  info: (msg: string) => console.log(chalk.blue('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✓'), msg),
  error: (msg: string) => console.error(chalk.red('✗'), msg),
  warn: (msg: string) => console.log(chalk.yellow('⚠'), msg),
  title: (msg: string) => console.log(chalk.cyan.bold('\n' + msg + '\n')),
}

interface BootstrapCommand extends BotCommand {
  name: 'bootstrap'
  description: string
  register: (program: Command) => void
}

interface BootstrapOptions {
  environment?: 'local' | 'staging' | 'production'
  botName?: string
  botUsername?: string
  groupName?: string
  skipTopics?: boolean
  auto?: boolean
  bot?: string // Target specific bot
  list?: boolean // List available bots and prompt for import
  reuse?: boolean // Skip prompts, reuse if exists
  force?: boolean // Force recreate
}

const command: BootstrapCommand = {
  name: 'bootstrap',
  description: 'Full bootstrap: Create bot, group, and topics',

  register(program: Command) {
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
      .action(async (options) => {
        await handleBootstrap(options)
      })
  },
}

export default command

interface BootstrapResult {
  botToken?: string
  botUsername?: string
  chatId?: number
  controlTopicId?: number
  logTopicId?: number
  configTopicId?: number
  bugsTopicId?: number
  generalTopicId?: number
}

async function handleBootstrap(options: BootstrapOptions): Promise<void> {
  cliLogger.title('🚀 Complete Bot Bootstrap')

  const environment = (options.environment ?? 'local') as Environment

  // Initialize EnvManager and BootstrapState
  const envManager = new EnvManager()
  const bootstrapState = new BootstrapState({ envManager })

  // Handle --list flag: Show available bots from BotFather and exit
  if (options.list) {
    await handleListBots(options)
    return
  }

  // Check for --bot flag: Target specific bot
  let targetBotUsername = options.bot
  if (targetBotUsername) {
    if (!envManager.botExists(targetBotUsername)) {
      cliLogger.error(`Bot '${targetBotUsername}' does not exist`)
      return
    }
    cliLogger.info(`Targeting existing bot: ${chalk.cyan('@' + targetBotUsername)}`)
  }

  // Get active bot or target bot
  const activeBot = targetBotUsername || envManager.getActiveBot()
  if (activeBot) {
    cliLogger.info(`Active bot: ${chalk.cyan('@' + activeBot)}`)
  }

  const envFile = resolve(process.cwd(), 'core', `.env.${environment}`)

  // Verify .env file exists (fallback to old structure)
  const useOldEnvStructure = existsSync(envFile)
  if (!activeBot && !useOldEnvStructure) {
    cliLogger.error(`No active bot and environment file not found: ${envFile}`)
    cliLogger.info('Please run "bun run bootstrap" without flags to create a new bot.')
    return
  }

  // Load env file to check for existing API credentials (from old structure)
  let envContent = ''
  let envApiId: string | undefined
  let envApiHash: string | undefined

  if (useOldEnvStructure) {
    envContent = await readFile(envFile, 'utf-8')
    const apiIdMatch = envContent.match(/^TG_API_ID=(.+)$/m)
    const apiHashMatch = envContent.match(/^TG_API_HASH=(.+)$/m)

    envApiId = apiIdMatch?.[1]?.trim()
    envApiHash = apiHashMatch?.[1]?.trim()
  }

  const hasEnvCredentials = !!envApiId && !!envApiHash

  // Get API credentials (from env or prompt)
  const apiCredentials = await getApiCredentials(hasEnvCredentials, envApiId, envApiHash)
  if (!apiCredentials) {
    cliLogger.error('Failed to get API credentials')
    return
  }

  const spinner = ora({ color: 'cyan' })

  try {
    // Step 1: Initialize BootstrapClient
    cliLogger.info('Initializing Telegram client...')

    const client = new BootstrapClient({
      apiId: apiCredentials.apiId,
      apiHash: apiCredentials.apiHash,
    })

    // Save API credentials to env if requested
    if (apiCredentials.saveToEnv && useOldEnvStructure) {
      cliLogger.info('Saving API credentials to .env...')
      envContent = await readFile(envFile, 'utf-8')
      let updatedContent = envContent

      // Add or update API credentials
      updatedContent = updateEnvVar(updatedContent, 'TG_API_ID', String(apiCredentials.apiId))
      updatedContent = updateEnvVar(updatedContent, 'TG_API_HASH', apiCredentials.apiHash)

      await writeFile(envFile, updatedContent, 'utf-8')
      cliLogger.success('API credentials saved to .env')
    }

    // Ensure authorized (may prompt for phone/code/2FA)
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

    // Initialize bootstrap session
    bootstrapState.initialize({
      environment,
      apiId: apiCredentials.apiId,
      apiHash: apiCredentials.apiHash,
    })

    // Detect existing bot configuration
    const existingBot = activeBot ? await loadExistingBotConfig(activeBot, environment, envManager) : null

    // Fetch available bots from BotFather
    const botFather = new BotFatherManager(client)
    const availableBots = await bootstrapState.fetchAvailableBots(client, botFather)

    // Handle --reuse flag: Skip prompts, reuse if exists
    if (options.reuse && existingBot) {
      cliLogger.info(`Reusing existing bot: @${existingBot.botUsername}`)
      botToken = existingBot.botToken
      botUsername = existingBot.botUsername
    } else if (options.force) {
      // --force flag: Skip prompts, create new bot
      cliLogger.info('Force mode: Creating new bot...')
      const newBotResult = await createNewBot(client, botFather, spinner)
      if (!newBotResult.success) {
        return
      }
      botToken = newBotResult.botToken
      botUsername = newBotResult.botUsername
      botName = newBotResult.botName
    } else {
      // Interactive mode: Prompt user
      const botSelection = await bootstrapState.promptBotSelection(availableBots, existingBot)

      if (botSelection.action === 'cancel') {
        cliLogger.info('Bootstrap cancelled')
        return
      }

      if (botSelection.action === 'reuse') {
        // Reuse existing bot
        const reuseBotUsername = botSelection.botUsername || existingBot?.botUsername
        if (!reuseBotUsername) {
          cliLogger.error('No bot username selected')
          return
        }
        botUsername = reuseBotUsername

        // Try to load token from existing config or BotFather
        const botInfo = availableBots.find(b => b.username === reuseBotUsername)
        if (botInfo?.token) {
          botToken = botInfo.token
        } else if (existingBot?.botToken) {
          botToken = existingBot.botToken
        } else {
          cliLogger.warn('Bot token not found in config, you may need to recreate the bot')
        }
        cliLogger.success(`Reusing bot: @${botUsername}`)
      } else {
        // Create new bot
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

    // Fetch existing supergroups/forums the user is admin of
    const forumsResult = await groupManager.getUserForums()
    const existingGroups: import('../../packages/bootstrapper/src/bootstrap-state.js').GroupInfo[] =
      forumsResult.success && forumsResult.forums
        ? forumsResult.forums.map((f) => ({
            id: f.id,
            title: f.title,
            username: f.username,
            type: 'supergroup' as const,
            isForum: f.isForum,
            memberCount: f.memberCount,
          }))
        : []

    // If there's a configured group, add it to the list if not already present
    const configuredGroupId = existingBot?.controlChatId ? Number(existingBot.controlChatId) : null
    if (configuredGroupId) {
      const alreadyInList = existingGroups.find((g) => g.id === configuredGroupId)
      if (!alreadyInList) {
        // Add configured group at the beginning
        existingGroups.unshift({
          id: configuredGroupId,
          title: '⭐ Configured Group',
          type: 'supergroup' as const,
          isForum: true,
        })
      } else {
        // Mark it as configured
        alreadyInList.title = `⭐ ${alreadyInList.title} (configured)`
      }
    }

    // Always show group selection prompt (unless force mode)
    if (options.force) {
      // Force create new group
      const newGroupResult = await createNewGroup(client, groupManager, spinner, botUsername, botName, options)
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
        // Create new group
        const newGroupResult = await createNewGroup(client, groupManager, spinner, botUsername, botName, options)
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

    const bootstrapResult: BootstrapResult = {
      botToken,
      botUsername,
      chatId,
    }

    if (chatId && !options.skipTopics) {
      // Fetch existing topics from the forum group
      const topicGroupManager = new GroupManager(client)
      const topicsResult = await topicGroupManager.getForumTopics(chatId)
      const existingTopics: import('../../packages/bootstrapper/src/bootstrap-state.js').TopicInfo[] =
        topicsResult.success && topicsResult.topics
          ? topicsResult.topics.map((t) => ({
              id: t.id,
              name: t.name,
              iconColor: t.iconColor,
            }))
          : []

      const topicsSelection = await bootstrapState.promptTopicsSelection(existingTopics)

      const allTopicNames = ['General', 'Control', 'Logs', 'Config', 'Bugs']
      const topicManager = new TopicManager(botToken)

      // Helper function to map topic to result
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
          console.log(`  ${chalk.cyan(topic.name)}: ${chalk.yellow(String(topic.id))}`)
          mapTopicToResult(topic.name, topic.id)
        }
      } else if (topicsSelection.action === 'create_missing') {
        cliLogger.title('🧵 Step 3: Creating Topics')

        // Filter out topics that already exist
        const existingTopicNames = new Set(existingTopics.map((t) => t.name.toLowerCase()))
        const topicsToCreate = allTopicNames.filter((name) => !existingTopicNames.has(name.toLowerCase()))

        // First, map existing topics to result
        for (const topic of existingTopics) {
          console.log(`  ${chalk.cyan(topic.name)}: ${chalk.yellow(String(topic.id))} (existing)`)
          mapTopicToResult(topic.name, topic.id)
        }

        // Create missing topics
        if (topicsToCreate.length > 0) {
          spinner.text = `Creating ${topicsToCreate.length} new topics...`
          spinner.start()

          const topicResults = await topicManager.createTopics(chatId, topicsToCreate)
          spinner.succeed(`Created ${topicResults.length} new topics`)

          for (const { name, result } of topicResults) {
            if (result.success && result.threadId) {
              console.log(`  ${chalk.cyan(name)}: ${chalk.yellow(String(result.threadId))}`)
              mapTopicToResult(name, result.threadId)
            }
          }
        } else {
          cliLogger.info('All required topics already exist')
        }
      } else if (topicsSelection.action === 'recreate_all') {
        cliLogger.title('🧵 Step 3: Recreating Topics')

        // Delete all topics except General ID 1
        const topicsToDelete = existingTopics.filter((t) => t.id !== 1)
        if (topicsToDelete.length > 0) {
          spinner.text = `Deleting ${topicsToDelete.length} topics...`
          spinner.start()

          for (const topic of topicsToDelete) {
            await topicGroupManager.deleteTopic(chatId, topic.id)
          }
          spinner.succeed(`Deleted ${topicsToDelete.length} topics`)
        }

        // Create fresh topics (skip General if ID 1 exists)
        const hasDefaultGeneral = existingTopics.some((t) => t.id === 1)
        const topicsToCreate = hasDefaultGeneral
          ? allTopicNames.filter((n) => n.toLowerCase() !== 'general')
          : allTopicNames

        if (hasDefaultGeneral) {
          // Map the default General topic
          mapTopicToResult('General', 1)
          console.log(`  ${chalk.cyan('General')}: ${chalk.yellow('1')} (default)`)
        }

        if (topicsToCreate.length > 0) {
          spinner.text = `Creating ${topicsToCreate.length} topics...`
          spinner.start()

          const topicResults = await topicManager.createTopics(chatId, topicsToCreate)
          spinner.succeed(`Created ${topicResults.length} topics`)

          for (const { name, result } of topicResults) {
            if (result.success && result.threadId) {
              console.log(`  ${chalk.cyan(name)}: ${chalk.yellow(String(result.threadId))}`)
              mapTopicToResult(name, result.threadId)
            }
          }
        }
      } else if (topicsSelection.action === 'delete_duplicates') {
        cliLogger.title('🧵 Step 3: Deleting Duplicates')

        // Find duplicates (same name, keep lowest ID)
        const seen = new Map<string, number>()
        const toDelete: number[] = []

        // Sort by ID ascending so we keep the lowest ID
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
              // Can't delete default General
              await topicGroupManager.deleteTopic(chatId, topicId)
            }
          }
          spinner.succeed(`Deleted ${toDelete.length} duplicate topics`)
        } else {
          cliLogger.info('No duplicates found')
        }

        // Map remaining topics
        for (const [_name, id] of seen.entries()) {
          const originalTopic = existingTopics.find((t) => t.id === id)
          if (originalTopic) {
            console.log(`  ${chalk.cyan(originalTopic.name)}: ${chalk.yellow(String(id))}`)
            mapTopicToResult(originalTopic.name, id)
          }
        }
      }
    }

    // ========================================
    // PHASE 4: Update Configuration
    // ========================================

    cliLogger.title('🔧 Step 4: Updating Configuration')
    spinner.text = 'Updating bot configuration...'
    spinner.start()

    // Update configuration using EnvManager
    await envManager.updateEnv(botUsername, environment, {
      botToken: bootstrapResult.botToken,
      controlChatId: bootstrapResult.chatId ? String(bootstrapResult.chatId) : undefined,
      controlTopicId: bootstrapResult.controlTopicId,
      logChatId: bootstrapResult.chatId ? String(bootstrapResult.chatId) : undefined,
      logTopicId: bootstrapResult.logTopicId,
    })

    // Set as active bot if not already
    const currentActive = envManager.getActiveBot()
    if (currentActive !== botUsername) {
      await envManager.setActiveBot(botUsername)
    }

    spinner.succeed(`Configuration saved for @${botUsername}`)

    // Summary
    cliLogger.title('✅ Bootstrap Complete')
    console.log('')
    console.log(chalk.bold('Bot Information:'))
    console.log(`  Username: ${chalk.green('@' + botUsername)}`)
    console.log(`  Token: ${chalk.yellow(botToken.slice(0, 10) + '...')}`)
    console.log(`  Environment: ${chalk.cyan(environment)}`)
    console.log('')

    if (chatId) {
      console.log(chalk.bold('Group Information:'))
      console.log(`  Name: ${chalk.cyan(groupName || 'Unknown')}`)
      console.log(`  Chat ID: ${chalk.yellow(String(chatId))}`)
      console.log('')
    }

    if (bootstrapResult.controlTopicId || bootstrapResult.logTopicId) {
      console.log(chalk.bold('Topic IDs:'))
      if (bootstrapResult.generalTopicId) console.log(`  General: ${chalk.yellow(String(bootstrapResult.generalTopicId))}`)
      if (bootstrapResult.controlTopicId) console.log(`  Control: ${chalk.yellow(String(bootstrapResult.controlTopicId))}`)
      if (bootstrapResult.logTopicId) console.log(`  Logs: ${chalk.yellow(String(bootstrapResult.logTopicId))}`)
      if (bootstrapResult.configTopicId) console.log(`  Config: ${chalk.yellow(String(bootstrapResult.configTopicId))}`)
      if (bootstrapResult.bugsTopicId) console.log(`  Bugs: ${chalk.yellow(String(bootstrapResult.bugsTopicId))}`)
      console.log('')
    }

    cliLogger.success('Your bot is now ready to use!')
    console.log('')
    cliLogger.info('Configuration saved to:')
    console.log(`  ${chalk.cyan(`core/.envs/${botUsername}/${environment}.env`)}`)
    console.log('')
    cliLogger.info('Next steps:')
    console.log(`  ${chalk.dim('1.')} Run: ${chalk.cyan('bun run dev')}`)
    console.log(`  ${chalk.dim('2.')} Send /start to @${botUsername} in Telegram`)
    console.log('')

    // Cleanup
    await client.disconnect()
  } catch (error) {
    spinner.stop()
    cliLogger.error('Bootstrap failed')
    if (error instanceof Error) {
      console.error(chalk.dim(`  ${error.message}`))
    }
  }
}

/**
 * Get API credentials from user
 * @param fromEnv - If credentials come from environment variables
 * @param envApiId - API ID from environment (if available)
 * @param envApiHash - API Hash from environment (if available)
 */
async function getApiCredentials(
  fromEnv: boolean,
  envApiId?: string,
  envApiHash?: string
): Promise<{ apiId: number; apiHash: string; saveToEnv: boolean } | null> {
  // If credentials are in environment, use them directly
  if (fromEnv && envApiId && envApiHash) {
    const apiId = parseInt(envApiId, 10)
    if (isNaN(apiId)) {
      cliLogger.error('Invalid TG_API_ID in environment file. Must be a number.')
      return null
    }
    return { apiId, apiHash: envApiHash, saveToEnv: false }
  }

  cliLogger.title('📱 Telegram MTProto API Credentials')

  console.log('')
  console.log(chalk.bold('To create bots and groups automatically, you need MTProto API credentials.'))
  console.log('')
  console.log(chalk.cyan('📋 STEP-BY-STEP GUIDE:'))
  console.log('')
  console.log(chalk.dim('1. Open https://my.telegram.org in your browser'))
  console.log(chalk.dim('2. Log in with your phone number (the same number you use in Telegram)'))
  console.log(chalk.dim('3. Click on "API development tools"'))
  console.log(chalk.dim('4. Fill in the form:'))
  console.log(chalk.dim('   - App title: My Bot App'))
  console.log(chalk.dim('   - Short name: mybotapp'))
  console.log(chalk.dim('   - Platform: Desktop or Web'))
  console.log(chalk.dim('   - Description: (optional)'))
  console.log(chalk.dim('5. Click "Create application"'))
  console.log(chalk.dim('6. Copy the api_id and api_hash from the next page'))
  console.log('')

  const useEnv = await confirm({
    message: 'Do you want to save API credentials to .env file for future use?',
    default: true,
  })

  console.log('')

  const apiId = await input({
    message: 'Enter your API ID:',
    validate: (value: string) => {
      const num = parseInt(value, 10)
      if (isNaN(num)) {
        return 'API ID must be a number'
      }
      if (num < 1) {
        return 'API ID must be positive'
      }
      return true
    },
  })

  const apiHash = await input({
    message: 'Enter your API Hash:',
    validate: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'API Hash is required'
      }
      if (value.trim().length < 32) {
        return 'API Hash seems too short (should be 32+ characters)'
      }
      return true
    },
  })

  console.log('')
  console.log(chalk.cyan('🔐 Next: TELEGRAM LOGIN'))
  console.log('')
  console.log(chalk.dim('After you enter your credentials, you will need to:'))
  console.log(chalk.dim('1. Enter your phone number (with country code, e.g., +34612345678)'))
  console.log(chalk.dim('2. Enter the verification code you receive via Telegram'))
  console.log(chalk.dim('3. Enter your 2FA password (if you have Cloud Password enabled)'))
  console.log(chalk.dim('4. Your session will be saved for future use'))
  console.log('')

  const proceed = await confirm({
    message: 'Ready to continue?',
    default: true,
  })

  if (!proceed) {
    return null
  }

  return {
    apiId: parseInt(apiId, 10),
    apiHash: apiHash.trim(),
    saveToEnv: useEnv,
  }
}

/**
 * Update .env file with bootstrap results
 */
async function updateEnvFile(envFile: string, result: BootstrapResult): Promise<void> {
  const envContent = await readFile(envFile, 'utf-8')
  let updatedContent = envContent

  // Update bot token
  if (result.botToken) {
    updatedContent = updateEnvVar(updatedContent, 'TG_BOT_TOKEN', result.botToken)
  }

  // Update control chat ID
  if (result.chatId) {
    updatedContent = updateEnvVar(updatedContent, 'TG_CONTROL_CHAT_ID', String(result.chatId))
  }

  // Update control topic ID
  if (result.controlTopicId) {
    updatedContent = updateEnvVar(updatedContent, 'TG_CONTROL_TOPIC_ID', String(result.controlTopicId))
  }

  // Update log topic ID
  if (result.logTopicId) {
    updatedContent = updateEnvVar(updatedContent, 'TG_LOG_TOPIC_ID', String(result.logTopicId))
  }

  await writeFile(envFile, updatedContent, 'utf-8')
}

/**
 * Update a single environment variable in the content
 */
function updateEnvVar(content: string, key: string, value: string): string {
  // Check if variable exists (not commented)
  const exists = new RegExp(`^${key}=(.+)$`, 'm').test(content)

  if (exists) {
    // Update existing variable
    return content.replace(new RegExp(`^${key}=(.+)$`, 'm'), `${key}=${value}`)
  }

  // Check if variable is commented out
  const commentedMatch = content.match(new RegExp(`^#\\s*${key}=(.+)$`, 'm'))
  if (commentedMatch) {
    // Uncomment and update
    return content.replace(new RegExp(`^#\\s*${key}=(.+)$`, 'm'), `${key}=${value}`)
  }

  // Add new variable at the end
  return content.trimEnd() + `\n${key}=${value}\n`
}

/**
 * Handle --list flag: Show available bots from BotFather and prompt for import
 * @param options - Bootstrap options
 */
async function handleListBots(options: BootstrapOptions): Promise<void> {
  cliLogger.title('📋 Bots from BotFather')

  // Try to get API credentials from existing .env files
  const environment = (options.environment ?? 'local') as Environment
  const envFile = resolve(process.cwd(), 'core', `.env.${environment}`)
  const envManager = new EnvManager()

  let apiId: string | undefined
  let apiHash: string | undefined

  // First, try to read from legacy .env.{environment} file
  if (existsSync(envFile)) {
    const envContent = await readFile(envFile, 'utf-8')
    const apiIdMatch = envContent.match(/^TG_API_ID=(.+)$/m)
    const apiHashMatch = envContent.match(/^TG_API_HASH=(.+)$/m)
    apiId = apiIdMatch?.[1]?.trim()
    apiHash = apiHashMatch?.[1]?.trim()
  }

  // If not found in legacy file, try to get from active bot
  if (!apiId || !apiHash) {
    const activeBot = envManager.getActiveBot()
    if (activeBot) {
      const botEnvFile = resolve(process.cwd(), 'core', '.envs', activeBot, `${environment}.env`)
      if (existsSync(botEnvFile)) {
        const envContent = await readFile(botEnvFile, 'utf-8')
        const apiIdMatch = envContent.match(/^TG_API_ID=(.+)$/m)
        const apiHashMatch = envContent.match(/^TG_API_HASH=(.+)$/m)
        apiId = apiIdMatch?.[1]?.trim()
        apiHash = apiHashMatch?.[1]?.trim()
      }
    }
  }

  // If credentials found in env, use them; otherwise prompt user
  let finalApiId: number
  let finalApiHash: string

  if (apiId && apiHash) {
    cliLogger.success('Found API credentials in environment file')
    finalApiId = parseInt(apiId, 10)
    finalApiHash = apiHash
  } else {
    cliLogger.info('API credentials not found in environment files')
    // Get API credentials from user
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
  }

  const spinner = ora({ color: 'cyan' })
  spinner.text = 'Connecting to Telegram...'
  spinner.start()

  // Read LOG_LEVEL to determine if gramJS logs should be muted
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

    // Keep gramJS muted during BotFather operations if LOG_LEVEL != debug
    if (shouldMuteGramJS) {
      client.muteLogs()
    }

    // Fetch available bots from BotFather
    const botFather = new BotFatherManager(client)

    // Stop spinner for detailed progress output
    spinner.stop()

    console.log('')
    console.log(chalk.bold('Fetching bots from BotFather...'))
    console.log('')

    const botsWithTokens = await botFather.getAllBotsWithTokens()

    // Restore console logs after BotFather operations
    if (shouldMuteGramJS) {
      client.unmuteLogs()
    }

    if (botsWithTokens.length === 0) {
      cliLogger.info('No bots found. Create your first bot with: bun run bootstrap')
      await client.disconnect()
      return
    }

    console.log('')
    console.log(chalk.bold(`Found ${botsWithTokens.length} bot(s):`))
    console.log('')

    for (const bot of botsWithTokens) {
      const alreadyConfigured = envManager.botExists(bot.username)
      const statusIndicator = alreadyConfigured ? chalk.yellow('⚠') : chalk.green('✓')
      const statusText = alreadyConfigured ? chalk.dim(' (already configured)') : ''

      console.log(`  ${statusIndicator} ${chalk.green('@' + bot.username)} - ${chalk.cyan(bot.name)}${statusText}`)
    }

    console.log('')

    // Ask if user wants to import
    const wantsToImport = await confirm({
      message: 'Do you want to import any of these bots?',
      default: true,
    })

    if (!wantsToImport) {
      cliLogger.info('Import cancelled')
      await client.disconnect()
      return
    }

    // Filter out already configured bots for the selection
    const availableBots = botsWithTokens.filter(bot => !envManager.botExists(bot.username))

    if (availableBots.length === 0) {
      cliLogger.info('All bots are already configured')
      await client.disconnect()
      return
    }

    let botsToImport: Array<{ username: string; name: string; token: string }>

    // If only one bot available, ask directly
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
      // Multiple bots: show selection or import all
      const importMode = await confirm({
        message: `Import all ${availableBots.length} available bots?`,
        default: false,
      })

      if (importMode) {
        botsToImport = availableBots
      } else {
        // Interactive selection
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

    // Import selected bots
    console.log('')
    cliLogger.title('📦 Importing Bots')

    const environment = (options.environment ?? 'local') as Environment

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
      } catch (error) {
        spinner.fail(`Failed to create config for @${bot.username}`)
        failed++
      }
    }

    // Set active bot if not set
    const currentActive = envManager.getActiveBot()
    if (!currentActive && botsToImport.length > 0) {
      const firstBot = botsToImport[0]
      if (firstBot) {
        await envManager.setActiveBot(firstBot.username)
        cliLogger.success(`Set @${firstBot.username} as active bot`)
      }
    }

    // Show configured bots after import
    console.log('')
    const configuredBots = envManager.listBots()

    if (configuredBots.length > 0) {
      console.log(chalk.bold('Configured bots:'))
      console.log('')

      for (const bot of configuredBots) {
        const activeMarker = bot.isActive ? chalk.green('✓ ') : '  '
        const environments = []
        if (bot.hasLocal) environments.push(chalk.cyan('local'))
        if (bot.hasStaging) environments.push(chalk.yellow('staging'))
        if (bot.hasProduction) environments.push(chalk.red('production'))

        console.log(`  ${activeMarker}${chalk.green('@' + bot.username)}`)
        console.log(`      Environments: ${environments.join(', ')}`)
      }
      console.log('')
    }

    // Summary
    console.log('')
    cliLogger.title('✅ Import Complete')
    console.log('')
    console.log(chalk.bold('Summary:'))
    console.log(`  Imported: ${chalk.green(String(imported))}`)
    console.log(`  Failed:  ${chalk.red(String(failed))}`)
    console.log('')

    if (imported > 0) {
      cliLogger.success('Bots imported successfully!')
      cliLogger.info('Configuration saved to:')
      for (const bot of botsToImport) {
        if (!envManager.botExists(bot.username)) continue
        console.log(`  ${chalk.cyan(`core/.envs/${bot.username}/${environment}.env`)}`)
      }
      console.log('')
      cliLogger.info('Next steps:')
      console.log(`  ${chalk.dim('1.')} Run: ${chalk.cyan('bun run dev')}`)
      console.log(`  ${chalk.dim('2.')} Send /start to your bot in Telegram`)
      console.log(`  ${chalk.dim('3.')} Run: ${chalk.cyan('bun run bot list')} to see all configured bots`)
      console.log('')
    }

    await client.disconnect()
  } catch (error) {
    spinner.stop()
    // Ensure console is restored even if there's an error
    if (shouldMuteGramJS && client) {
      try {
        client.unmuteLogs()
      } catch {
        // Ignore errors during cleanup
      }
    }
    cliLogger.error('Failed to fetch bots')
    if (error instanceof Error) {
      console.error(chalk.dim(`  ${error.message}`))
    }
  } finally {
    // Ensure console is always restored
    if (shouldMuteGramJS && client !== null) {
      try {
        client.unmuteLogs()
      } catch {
        // Ignore errors during cleanup
      }
    }
  }
}

/**
 * Load existing bot configuration from EnvManager
 */
async function loadExistingBotConfig(
  botUsername: string,
  environment: Environment,
  envManager: EnvManager
): Promise<{ botUsername: string; botToken: string; environment: Environment; controlChatId?: string; controlTopicId?: number; logChatId?: string; logTopicId?: number } | null> {
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
 * Create a new bot with prompts
 */
async function createNewBot(
  client: BootstrapClient,
  botFather: BotFatherManager,
  spinner: any,
  options?: BootstrapOptions
): Promise<{ success: true; botToken: string; botUsername: string; botName: string } | { success: false; error?: string }> {
  let botName: string
  let botUsername: string

  if (options?.botName || options?.botUsername) {
    botName = options.botName ?? await input({ message: 'Enter bot display name:' })
    botUsername = options.botUsername ?? await input({
      message: 'Enter bot username (must end in "bot"):',
      validate: (value: string) => {
        if (!value.endsWith('bot')) {
          return 'Username must end with "bot"'
        }
        return true
      },
    })
  } else if (options?.auto) {
    botUsername = generateRandomUsername()
    botName = generateBotDisplayname(botUsername)
    cliLogger.info(`Auto-generated bot name: ${chalk.cyan(botName)}`)
    cliLogger.info(`Auto-generated username: ${chalk.cyan('@' + botUsername)}`)
  } else {
    botUsername = generateRandomUsername()
    botName = generateBotDisplayname(botUsername)

    cliLogger.info(`Generated bot name: ${chalk.cyan(botName)}`)
    cliLogger.info(`Generated username: ${chalk.cyan('@' + botUsername)}`)
    console.log('')

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

  cliLogger.title('🤖 Step 1: Creating Bot')
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
 * Create a new group with prompts
 */
async function createNewGroup(
  client: BootstrapClient,
  groupManager: GroupManager,
  spinner: any,
  botUsername: string | undefined,
  botName: string | undefined,
  options?: BootstrapOptions
): Promise<{ success: true; chatId: number; groupName: string } | { success: false; error?: string }> {
  let groupName: string

  if (options?.groupName) {
    groupName = options.groupName
  } else if (options?.auto) {
    groupName = generateGroupName(botName || 'My Bot')
    cliLogger.info(`Auto-generated group name: ${chalk.cyan(groupName)}`)
  } else {
    groupName = generateGroupName(botName || 'My Bot')
    cliLogger.info(`Generated group name: ${chalk.cyan(groupName)}`)

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

  cliLogger.title('💬 Step 2: Creating Group/Forum')
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

  // Add bot as admin
  spinner.text = 'Adding bot as admin...'
  spinner.start()

  await sleep(2000)

  const adminResult = await groupManager.addBotAsAdmin(
    groupResult.chatId,
    botUsername!,
    {
      canManageTopics: true,
      canDeleteMessages: true,
      canEditMessages: false,
      canInviteUsers: true,
    }
  )

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

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
