import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs'
import { resolve, dirname } from 'path'
import type { BootstrapClient } from './client.js'
import type { BotFatherManager, BotInfo } from './bot-father/index.js'
import type { GroupManager } from './group-manager.js'
import type { TopicManager } from './topic-manager.js'
import type { EnvManager } from './env-manager.js'
import type { Environment } from '../../../core/src/config/env.js'
import { input, select, confirm } from '@inquirer/prompts'
import chalk from 'chalk'

/**
 * Existing bot configuration detected from .env
 */
export interface ExistingBotConfig {
  botUsername: string
  botToken: string
  environment: Environment
  controlChatId?: string
  controlTopicId?: number
  logChatId?: string
  logTopicId?: number
}

/**
 * Bot selection result
 */
export interface BotSelection {
  action: 'create' | 'reuse' | 'cancel'
  botInfo?: BotInfo
  botUsername?: string
}

/**
 * Group information
 */
export interface GroupInfo {
  id: number
  title: string
  username?: string
  type: 'supergroup' | 'channel'
  isForum: boolean
  memberCount?: number
}

/**
 * Group selection result
 */
export interface GroupSelection {
  action: 'create' | 'reuse' | 'skip'
  groupInfo?: GroupInfo
  chatId?: number
}

/**
 * Topic information
 */
export interface TopicInfo {
  id: number
  name: string
  iconColor?: number
}

/**
 * Topics selection result
 */
export interface TopicsSelection {
  action: 'reuse' | 'recreate_all' | 'create_missing' | 'delete_duplicates' | 'skip'
  topics?: TopicInfo[]
}

/**
 * Bootstrap session state
 */
export interface BootstrapSessionState {
  sessionId: string
  startTime: string
  step: BootstrapStep
  botSelection: BotSelection | null
  groupSelection: GroupSelection | null
  topicsSelection: TopicsSelection | null
  environment: Environment
  apiCredentials?: {
    apiId: number
    apiHash: string
  }
}

/**
 * Bootstrap step
 */
export type BootstrapStep =
  | 'init'
  | 'bot_selection'
  | 'group_selection'
  | 'topics_selection'
  | 'creating_bot'
  | 'creating_group'
  | 'creating_topics'
  | 'updating_env'
  | 'complete'

/**
 * Bootstrap state manager
 */
export class BootstrapState {
  private state: BootstrapSessionState | null = null
  private statePath: string
  private readonly envManager: EnvManager

  constructor(options?: { stateDir?: string; envManager?: EnvManager }) {
    const baseDir = options?.stateDir ?? resolve(process.cwd(), 'core', 'tmp')
    this.statePath = resolve(baseDir, 'bootstrap-state.json')
    this.envManager = options?.envManager ?? (null as unknown as EnvManager)

    // Ensure state directory exists
    if (!existsSync(dirname(this.statePath))) {
      mkdirSync(dirname(this.statePath), { recursive: true })
    }
  }

  /**
   * Initialize new bootstrap session
   */
  initialize(options: { environment: Environment; apiId: number; apiHash: string }): void {
    this.state = {
      sessionId: this.generateSessionId(),
      startTime: new Date().toISOString(),
      step: 'init',
      botSelection: null,
      groupSelection: null,
      topicsSelection: null,
      environment: options.environment,
      apiCredentials: {
        apiId: options.apiId,
        apiHash: options.apiHash,
      },
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Detect existing bot from current .env
   */
  detectExistingBot(): ExistingBotConfig | null {
    const env = process.env

    if (!env.TG_BOT_TOKEN) {
      return null
    }

    // Try to extract username from token by calling getMe
    // For now, return null as we can't extract username without Telegram API
    // This will be enhanced when we have access to Telegram client
    return null
  }

  /**
   * Fetch available bots from BotFather
   */
  async fetchAvailableBots(client: BootstrapClient, botFather: BotFatherManager): Promise<BotInfo[]> {
    const result = await botFather.listBots()

    if (!result.success || !result.bots) {
      return []
    }

    return result.bots
  }

  /**
   * Prompt for bot selection
   */
  async promptBotSelection(
    availableBots: BotInfo[],
    currentBot?: ExistingBotConfig | null
  ): Promise<BotSelection> {
    console.log('')
    console.log(chalk.cyan.bold('🤖 Bot Selection'))

    // If current bot exists, prompt for reuse/create
    if (currentBot) {
      console.log('')
      console.log(chalk.yellow(`Found existing bot configuration`))
      console.log(chalk.gray(`Environment: ${currentBot.environment}`))

      const choices = [
        { name: '✅ Reuse this bot', value: 'reuse' },
        { name: '➕ Create new bot', value: 'create' },
        { name: '❌ Cancel', value: 'cancel' },
      ]

      const action = await select({
        message: 'What would you like to do?',
        choices,
      })

      if (action === 'cancel') {
        return { action: 'cancel' }
      }

      if (action === 'reuse') {
        return {
          action: 'reuse',
          botUsername: currentBot.botUsername,
        }
      }

      // Continue to create new bot
    }

    // Show available bots
    if (availableBots.length > 0) {
      console.log('')
      console.log(chalk.cyan('Your bots:'))

      // Put Create and Cancel options first, then available bots
      const botChoices = [
        { name: '➕ Create new bot', value: '__create__' },
        { name: '❌ Cancel', value: '__cancel__' },
        ...availableBots.map((bot) => ({
          name: `${chalk.green('@' + bot.username)} - ${bot.name}`,
          value: bot.username,
        })),
      ]

      const selected = await select({
        message: 'Select a bot or create a new one:',
        choices: botChoices,
      })

      if (selected === '__cancel__') {
        return { action: 'cancel' }
      }

      if (selected === '__create__') {
        return { action: 'create' }
      }

      const botInfo = availableBots.find((b) => b.username === selected)
      return {
        action: 'reuse',
        botInfo,
        botUsername: selected,
      }
    }

    // No bots available, ask to create
    console.log('')
    console.log(chalk.yellow('No bots found. You need to create a new bot.'))

    const createChoice = await confirm({
      message: 'Create a new bot?',
      default: true,
    })

    if (!createChoice) {
      return { action: 'cancel' }
    }

    return { action: 'create' }
  }

  /**
   * Prompt for group selection
   */
  async promptGroupSelection(existingGroups: GroupInfo[]): Promise<GroupSelection> {
    console.log('')
    console.log(chalk.cyan.bold('💬 Group Selection'))

    if (existingGroups.length === 0) {
      const createGroup = await confirm({
        message: 'Create a new group/forum?',
        default: true,
      })

      if (!createGroup) {
        return { action: 'skip' }
      }

      return { action: 'create' }
    }

    console.log('')
    console.log(chalk.cyan('Existing groups/forums:'))

    // Put Create and Skip options first, then existing groups
    const groupChoices = [
      { name: '➕ Create new group', value: '__create__' },
      { name: '⏭️  Skip (no group)', value: '__skip__' },
      ...existingGroups.map((group) => ({
        name: `${group.title} (${group.isForum ? 'Forum' : 'Group'}) [ID: ${group.id}]`,
        value: group.id.toString(),
      })),
    ]

    const selected = await select({
      message: 'Select a group or create a new one:',
      choices: groupChoices,
    })

    if (selected === '__skip__') {
      return { action: 'skip' }
    }

    if (selected === '__create__') {
      return { action: 'create' }
    }

    const groupInfo = existingGroups.find((g) => g.id.toString() === selected)
    return {
      action: 'reuse',
      groupInfo,
      chatId: groupInfo?.id,
    }
  }

  /**
   * Prompt for topics selection
   */
  async promptTopicsSelection(existingTopics: TopicInfo[]): Promise<TopicsSelection> {
    console.log('')
    console.log(chalk.cyan.bold('📝 Topics Selection'))

    if (existingTopics.length === 0) {
      const createTopics = await confirm({
        message: 'Create standard topics (General, Control, Logs, Config, Bugs)?',
        default: true,
      })

      if (!createTopics) {
        return { action: 'skip' }
      }

      return { action: 'create_missing' }
    }

    console.log('')
    console.log(chalk.cyan('Existing topics:'))

    // Check for duplicates
    const topicNames = new Map<string, number[]>()
    existingTopics.forEach((topic) => {
      const name = topic.name.toLowerCase()
      const ids = topicNames.get(name) || []
      ids.push(topic.id)
      topicNames.set(name, ids)
    })

    const hasDuplicates = Array.from(topicNames.values()).some((ids) => ids.length > 1)

    existingTopics.forEach((topic) => {
      const name = topic.name.toLowerCase()
      const ids = topicNames.get(name) || []
      const isDuplicate = ids.length > 1
      const marker = isDuplicate ? chalk.red(' ⚠️ duplicate') : ''
      console.log(`  • ${topic.name} [ID: ${topic.id}]${marker}`)
    })

    if (hasDuplicates) {
      console.log('')
      console.log(chalk.yellow('⚠️  Duplicate topics detected!'))
    }

    console.log('')

    const choices: { name: string; value: string }[] = [
      { name: '✅ Use existing topics', value: 'reuse' },
      { name: '➕ Create missing only (keep existing)', value: 'create_missing' },
      { name: '🔄 Recreate ALL (delete + create fresh)', value: 'recreate_all' },
    ]

    // Only show delete duplicates option if there are duplicates
    if (hasDuplicates) {
      choices.push({ name: '🗑️  Delete duplicates only', value: 'delete_duplicates' })
    }

    choices.push({ name: '⏭️  Skip (no topics)', value: 'skip' })

    const action = await select({
      message: 'What would you like to do?',
      choices,
    })

    if (action === 'skip') {
      return { action: 'skip' }
    }

    if (action === 'recreate_all') {
      return { action: 'recreate_all', topics: existingTopics }
    }

    if (action === 'create_missing') {
      return { action: 'create_missing', topics: existingTopics }
    }

    if (action === 'delete_duplicates') {
      return { action: 'delete_duplicates', topics: existingTopics }
    }

    return {
      action: 'reuse',
      topics: existingTopics,
    }
  }

  /**
   * Save bootstrap state
   */
  async saveState(): Promise<void> {
    if (!this.state) {
      throw new Error('No active session to save')
    }

    writeFileSync(this.statePath, JSON.stringify(this.state, null, 2), 'utf-8')
  }

  /**
   * Load bootstrap state
   */
  async loadState(): Promise<BootstrapSessionState | null> {
    if (!existsSync(this.statePath)) {
      return null
    }

    try {
      const content = readFileSync(this.statePath, 'utf-8')
      this.state = JSON.parse(content) as BootstrapSessionState
      return this.state
    } catch {
      return null
    }
  }

  /**
   * Clear bootstrap state
   */
  async clearState(): Promise<void> {
    if (existsSync(this.statePath)) {
      // @ts-ignore - unlinkSync exists
      unlinkSync(this.statePath)
    }
    this.state = null
  }

  /**
   * Get current state
   */
  getState(): BootstrapSessionState | null {
    return this.state
  }

  /**
   * Update state step
   */
  updateStep(step: BootstrapStep): void {
    if (!this.state) {
      throw new Error('No active session')
    }
    this.state.step = step
  }

  /**
   * Update bot selection
   */
  updateBotSelection(selection: BotSelection): void {
    if (!this.state) {
      throw new Error('No active session')
    }
    this.state.botSelection = selection
  }

  /**
   * Update group selection
   */
  updateGroupSelection(selection: GroupSelection): void {
    if (!this.state) {
      throw new Error('No active session')
    }
    this.state.groupSelection = selection
  }

  /**
   * Update topics selection
   */
  updateTopicsSelection(selection: TopicsSelection): void {
    if (!this.state) {
      throw new Error('No active session')
    }
    this.state.topicsSelection = selection
  }
}
