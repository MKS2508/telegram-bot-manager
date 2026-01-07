/**
 * Environment and multibot configuration types.
 *
 * Types for managing multiple bot configurations via .envs/ structure.
 *
 * @module
 */

// =============================================================================
// Environment Enum
// =============================================================================

/**
 * Supported environment types.
 */
export const Environment = {
  LOCAL: 'local',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const

export type Environment = (typeof Environment)[keyof typeof Environment]

// =============================================================================
// Bot Metadata
// =============================================================================

/**
 * Metadata stored for each configured bot.
 *
 * Stored in `.envs/{botUsername}/metadata.json`.
 *
 * @example
 * ```typescript
 * const metadata: IBotMetadata = {
 *   username: 'mybot123bot',
 *   name: 'My Bot',
 *   createdAt: '2024-01-01T00:00:00.000Z',
 *   environments: ['local', 'staging']
 * };
 * ```
 */
export interface IBotMetadata {
  /** Bot username (without @) */
  username: string
  /** Bot display name */
  name: string
  /** ISO timestamp of creation */
  createdAt: string
  /** ISO timestamp of last update */
  updatedAt?: string
  /** Environments configured for this bot */
  environments: Environment[]
  /** Who created this configuration */
  createdBy?: string
  /** Optional description */
  description?: string
  /** Optional tags for organization */
  tags?: string[]
}

// =============================================================================
// Configured Bot
// =============================================================================

/**
 * A bot that has been configured in .envs/.
 *
 * Returned by EnvManager.listBots().
 *
 * @example
 * ```typescript
 * const bots = envManager.listBots();
 * bots.forEach(bot => {
 *   console.log(`@${bot.username} ${bot.isActive ? '(active)' : ''}`);
 * });
 * ```
 */
export interface IConfiguredBot {
  /** Bot username (without @) */
  username: string
  /** Whether local.env exists */
  hasLocal: boolean
  /** Whether staging.env exists */
  hasStaging: boolean
  /** Whether production.env exists */
  hasProduction: boolean
  /** Whether this is the active bot (.active symlink) */
  isActive: boolean
  /** Bot metadata if available */
  metadata: IBotMetadata | null
}

// =============================================================================
// Environment Configuration
// =============================================================================

/**
 * Environment configuration values.
 *
 * Values stored in `.envs/{botUsername}/{environment}.env`.
 *
 * @example
 * ```typescript
 * const config: IEnvConfig = {
 *   botToken: '123456:ABC-DEF...',
 *   mode: 'polling',
 *   controlChatId: '-1001234567890',
 *   controlTopicId: 3
 * };
 * ```
 */
export interface IEnvConfig {
  /** Bot token for Bot API */
  botToken: string
  /** Bot mode: polling or webhook */
  mode?: 'polling' | 'webhook'
  /** Webhook URL (if mode is webhook) */
  webhookUrl?: string
  /** Webhook secret (if mode is webhook) */
  webhookSecret?: string
  /** Control chat ID */
  controlChatId?: string
  /** Control topic ID */
  controlTopicId?: number
  /** Log chat ID */
  logChatId?: string
  /** Log topic ID */
  logTopicId?: number
  /** Config topic ID */
  configTopicId?: number
  /** Bugs topic ID */
  bugsTopicId?: number
  /** General topic ID */
  generalTopicId?: number
  /** Instance name for locking */
  instanceName?: string
  /** Instance ID */
  instanceId?: string
  /** Log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  /** Current environment */
  environment?: Environment
  /** Whether to check for existing instances */
  instanceCheck?: boolean
  /** Lock backend: pid or redis */
  lockBackend?: 'pid' | 'redis'
  /** Redis URL for distributed locking */
  redisUrl?: string
  /** Whether ngrok is enabled */
  ngrokEnabled?: boolean
  /** Ngrok port */
  ngrokPort?: number
  /** Ngrok custom domain */
  ngrokDomain?: string
  /** Ngrok region */
  ngrokRegion?: string
  /** Ngrok auth token */
  ngrokAuthToken?: string
}

// =============================================================================
// Migration
// =============================================================================

/**
 * Result of migrating old .env files to new structure.
 */
export interface IMigrationResult {
  /** Whether migration was successful */
  success: boolean
  /** Bots that were migrated */
  migrated: string[]
  /** Errors during migration */
  errors?: string[]
}

// =============================================================================
// EnvManager Options
// =============================================================================

/**
 * Options for creating EnvManager.
 */
export interface IEnvManagerOptions {
  /** Base directory for .envs/ structure (default: core/.envs) */
  envsDir?: string
}
