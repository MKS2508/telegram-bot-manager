export { BootstrapClient } from './client.js'
export type { TelegramClientConfig, SessionData } from './client.js'

export { BotFatherManager } from './bot-father/index.js'
export type {
  BotCreationResult,
  CreateBotOptions,
  BotInfo,
  BotListResult,
  BotInfoResult,
} from './bot-father/index.js'

export { GroupManager } from './group-manager.js'
export type {
  GroupCreationResult,
  CreateSupergroupOptions,
  ForumGroupInfo,
  ForumTopicInfo,
} from './group-manager.js'

export { TopicManager } from './topic-manager.js'
export type { TopicCreationResult, CreateTopicOptions } from './topic-manager.js'

export { EnvManager } from './env-manager.js'
export type {
  BotMetadata,
  ConfiguredBot,
  MigrationResult,
} from './env-manager.js'
export { Environment } from '../../../core/src/config/env.js'

export { BootstrapState } from './bootstrap-state.js'
export type {
  ExistingBotConfig,
  BotSelection,
  GroupInfo,
  GroupSelection,
  TopicInfo,
  TopicsSelection,
  BootstrapSessionState,
  BootstrapStep,
} from './bootstrap-state.js'
