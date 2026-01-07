/**
 * BotFather automation types.
 *
 * Types for interacting with Telegram's @BotFather via MTProto.
 *
 * @module
 */

// =============================================================================
// Bot Information
// =============================================================================

/**
 * Basic information about a Telegram bot.
 *
 * @example
 * ```typescript
 * const bot: IBotInfo = {
 *   username: 'mybot123bot',
 *   name: 'My Bot',
 *   token: '123456:ABC-DEF...'
 * };
 * ```
 */
export interface IBotInfo {
  /** Bot username without @ (e.g., "mybot123bot") */
  username: string
  /** Bot display name */
  name: string
  /** Bot token (only available after fetching from BotFather) */
  token?: string
  /** Bot description (shown in bot profile) */
  description?: string
  /** Bot about text */
  about?: string
  /** Whether bot can be added to groups */
  canJoinGroups?: boolean
  /** Whether bot can read all group messages */
  canReadAllGroupMessages?: boolean
  /** Whether bot supports inline queries */
  supportsInlineQueries?: boolean
}

// =============================================================================
// Bot Creation
// =============================================================================

/**
 * Options for creating a new bot via BotFather.
 *
 * @example
 * ```typescript
 * const options: ICreateBotOptions = {
 *   botName: 'My Awesome Bot',
 *   botUsername: 'myawesomebot'
 * };
 * ```
 */
export interface ICreateBotOptions {
  /** Display name for the bot (shown in chats) */
  botName: string
  /** Username for the bot (must end in "bot", e.g., "mybot" or "my_bot") */
  botUsername: string
  /** Optional description to set after creation */
  description?: string
  /** Optional about text to set after creation */
  about?: string
}

/**
 * Result of bot creation operation.
 *
 * @example
 * ```typescript
 * if (result.isOk()) {
 *   console.log('Token:', result.value.botToken);
 *   console.log('Username:', result.value.botUsername);
 * }
 * ```
 */
export interface IBotCreationData {
  /** The bot token for Bot API authentication */
  botToken: string
  /** The bot username (without @) */
  botUsername: string
}

// =============================================================================
// Bot Commands
// =============================================================================

/**
 * A single bot command definition.
 *
 * @example
 * ```typescript
 * const command: IBotCommand = {
 *   command: 'start',
 *   description: 'Start the bot'
 * };
 * ```
 */
export interface IBotCommand {
  /** Command name without slash (e.g., "start", "help") */
  command: string
  /** Command description (shown in command menu) */
  description: string
}

/**
 * Options for setting bot commands.
 */
export interface ISetCommandsOptions {
  /** Bot username to configure */
  botUsername: string
  /** Array of commands to set */
  commands: IBotCommand[]
}

// =============================================================================
// Bot Configuration
// =============================================================================

/**
 * Options for setting bot description.
 */
export interface ISetDescriptionOptions {
  /** Bot username to configure */
  botUsername: string
  /** New description text */
  description: string
}

/**
 * Options for setting bot about text.
 */
export interface ISetAboutOptions {
  /** Bot username to configure */
  botUsername: string
  /** New about text */
  about: string
}

/**
 * Options for setting bot name.
 */
export interface ISetNameOptions {
  /** Bot username to configure */
  botUsername: string
  /** New display name */
  name: string
}

// =============================================================================
// BotFather Manager Configuration
// =============================================================================

/**
 * Configuration for BotFatherManager.
 *
 * @example
 * ```typescript
 * const config: IBotFatherConfig = {
 *   client: bootstrapClient,
 *   botFatherUsername: 'BotFather' // default
 * };
 * ```
 */
export interface IBotFatherConfig {
  /** GramJS client wrapper instance */
  client: unknown // Will be typed as BootstrapClient
  /** BotFather username (default: "BotFather") */
  botFatherUsername?: string
}

// =============================================================================
// Operation Results
// =============================================================================

/**
 * Result of bot creation operation.
 */
export interface IBotCreationResult {
  success: boolean
  botToken?: string
  botUsername?: string
  error?: string
}

/**
 * Result of listing bots operation.
 */
export interface IBotListResult {
  success: boolean
  bots?: IBotInfo[]
  error?: string
}

/**
 * Result of getting bot info operation.
 */
export interface IBotInfoResult {
  success: boolean
  bot?: IBotInfo
  error?: string
}

/**
 * Result of setting commands operation.
 */
export interface ISetCommandsResult {
  success: boolean
  commands?: IBotCommand[]
  error?: string
}

/**
 * Result of getting bot token operation.
 */
export interface IGetTokenResult {
  success: boolean
  token?: string
  error?: string
}

// =============================================================================
// Internal Types (for library implementation)
// =============================================================================

/**
 * Raw message type from GramJS.
 * @internal
 */
export type Message = unknown
