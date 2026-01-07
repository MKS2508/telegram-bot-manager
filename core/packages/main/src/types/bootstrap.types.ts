/**
 * Bootstrap flow types.
 *
 * Types for the interactive bootstrap process that creates bots, groups, and topics.
 *
 * @module
 */

import type { Environment } from './env.types.js'
import type { IBotInfo } from './bot-father.types.js'
import type { ITopicInfo } from './topic.types.js'

// =============================================================================
// Bootstrap Steps
// =============================================================================

/**
 * Steps in the bootstrap process.
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

// =============================================================================
// Bot Selection
// =============================================================================

/**
 * Existing bot configuration detected from .env.
 */
export interface IExistingBotConfig {
  /** Bot username */
  botUsername: string
  /** Bot token */
  botToken: string
  /** Current environment */
  environment: Environment
  /** Control chat ID if configured */
  controlChatId?: string
  /** Control topic ID if configured */
  controlTopicId?: number
  /** Log chat ID if configured */
  logChatId?: string
  /** Log topic ID if configured */
  logTopicId?: number
}

/**
 * Result of bot selection prompt.
 *
 * @example
 * ```typescript
 * const selection = await bootstrapState.promptBotSelection(bots);
 * if (selection.action === 'create') {
 *   // Create new bot
 * } else if (selection.action === 'reuse') {
 *   console.log('Using:', selection.botUsername);
 * }
 * ```
 */
export interface IBotSelection {
  /** Action to take */
  action: 'create' | 'reuse' | 'cancel'
  /** Selected bot info (if reusing from BotFather) */
  botInfo?: IBotInfo
  /** Selected bot username */
  botUsername?: string
}

// =============================================================================
// Group Selection
// =============================================================================

/**
 * Group information for selection.
 */
export interface IGroupInfo {
  /** Chat ID */
  id: number
  /** Group title */
  title: string
  /** Group username if public */
  username?: string
  /** Chat type */
  type: 'supergroup' | 'channel'
  /** Whether forum mode is enabled */
  isForum: boolean
  /** Number of members */
  memberCount?: number
}

/**
 * Result of group selection prompt.
 */
export interface IGroupSelection {
  /** Action to take */
  action: 'create' | 'reuse' | 'skip'
  /** Selected group info */
  groupInfo?: IGroupInfo
  /** Selected chat ID */
  chatId?: number
}

// =============================================================================
// Topics Selection
// =============================================================================

/**
 * Result of topics selection prompt.
 */
export interface ITopicsSelection {
  /** Action to take */
  action: 'reuse' | 'recreate_all' | 'create_missing' | 'delete_duplicates' | 'skip'
  /** Existing topics */
  topics?: ITopicInfo[]
}

// =============================================================================
// Bootstrap Session State
// =============================================================================

/**
 * Full bootstrap session state.
 *
 * Persisted to allow resuming interrupted bootstraps.
 */
export interface IBootstrapSessionState {
  /** Unique session ID */
  sessionId: string
  /** Session start timestamp */
  startTime: string
  /** Current step */
  step: BootstrapStep
  /** Bot selection result */
  botSelection: IBotSelection | null
  /** Group selection result */
  groupSelection: IGroupSelection | null
  /** Topics selection result */
  topicsSelection: ITopicsSelection | null
  /** Target environment */
  environment: Environment
  /** API credentials (stored for session) */
  apiCredentials?: {
    apiId: number
    apiHash: string
  }
}

// =============================================================================
// Bootstrap Result
// =============================================================================

/**
 * Final result of bootstrap process.
 *
 * @example
 * ```typescript
 * const result = await runBootstrap(options);
 * if (result.isOk()) {
 *   console.log('Bot:', result.value.botUsername);
 *   console.log('Group:', result.value.groupId);
 * }
 * ```
 */
export interface IBootstrapResult {
  /** Bot username */
  botUsername: string
  /** Bot token */
  botToken: string
  /** Group/forum chat ID */
  groupId?: number
  /** Group title */
  groupTitle?: string
  /** Control topic ID */
  controlTopicId?: number
  /** Log topic ID */
  logTopicId?: number
  /** Config topic ID */
  configTopicId?: number
  /** Bugs topic ID */
  bugsTopicId?: number
  /** General topic ID */
  generalTopicId?: number
  /** Path to created .env file */
  envFilePath: string
}

// =============================================================================
// Bootstrap Options
// =============================================================================

/**
 * Options for running bootstrap.
 *
 * @example
 * ```typescript
 * const options: IBootstrapOptions = {
 *   environment: 'local',
 *   apiId: 12345,
 *   apiHash: 'abc123',
 *   topics: ['General', 'Control', 'Logs'],
 *   setCommands: true
 * };
 * ```
 */
export interface IBootstrapOptions {
  /** Target environment */
  environment: Environment
  /** Telegram API ID */
  apiId: number
  /** Telegram API Hash */
  apiHash: string
  /** Bot username to use (skip BotFather fetch) */
  botUsername?: string
  /** Bot name for creation */
  botName?: string
  /** Group name for creation */
  groupName?: string
  /** Topics to create (default from config) */
  topics?: string[]
  /** Path to topics config file */
  topicsConfig?: string
  /** Topics to skip */
  skipTopics?: string[]
  /** Path to commands config file */
  commandsConfig?: string
  /** Set bot commands after creation */
  setCommands?: boolean
  /** Bot description to set */
  description?: string
  /** Bot about text to set */
  about?: string
  /** Skip all prompts, use defaults */
  auto?: boolean
  /** Use existing config without BotFather fetch */
  fromConfig?: boolean
  /** Reuse existing configuration */
  reuse?: boolean
  /** Force recreate existing configuration */
  force?: boolean
}
