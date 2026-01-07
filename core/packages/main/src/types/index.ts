/**
 * Type definitions for telegram-bot-manager.
 *
 * @module
 */

// BotFather types
export type {
  IBotInfo,
  ICreateBotOptions,
  IBotCreationData,
  IBotCommand,
  ISetCommandsOptions,
  ISetDescriptionOptions,
  ISetAboutOptions,
  ISetNameOptions,
  IBotFatherConfig,
} from './bot-father.types.js'

// Client types
export type {
  ITelegramClientConfig,
  ISessionData,
  IConnectOptions,
  IAuthOptions,
  ICurrentUser,
  IDialog,
} from './client.types.js'

// Group types
export type {
  ICreateSupergroupOptions,
  IGroupCreationData,
  IForumGroupInfo,
  IForumTopicInfo,
  IBotAdminPermissions,
  IChatInfo,
} from './group.types.js'

// Topic types
export type {
  ICreateTopicOptions,
  ITopicCreationData,
  ITopicsCreationData,
  ITopicConfig,
  ITopicsConfigFile,
  ITopicInfo,
  IExistingTopic,
} from './topic.types.js'

// Env types
export { Environment } from './env.types.js'
export type {
  IBotMetadata,
  IConfiguredBot,
  IEnvConfig,
  IMigrationResult,
  IEnvManagerOptions,
} from './env.types.js'

// Bootstrap types
export type { BootstrapStep } from './bootstrap.types.js'
export type {
  IExistingBotConfig,
  IBotSelection,
  IGroupInfo,
  IGroupSelection,
  ITopicsSelection,
  IBootstrapSessionState,
  IBootstrapResult,
  IBootstrapOptions,
} from './bootstrap.types.js'

// Error types
export { TelegramErrorCode } from './errors.types.js'
export type { TelegramErrorCode as TelegramErrorCodeType } from './errors.types.js'
