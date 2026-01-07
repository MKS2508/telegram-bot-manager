/**
 * @mks2508/telegram-bot-manager
 *
 * A library for automating Telegram bot creation and management via BotFather.
 *
 * @remarks
 * This library uses GramJS to interact with Telegram via MTProto protocol,
 * allowing automation of tasks that are not possible with the Bot API alone:
 * - Creating bots via @BotFather
 * - Creating supergroups and forums
 * - Adding bots as administrators
 * - Managing forum topics
 *
 * @example Basic usage
 * ```typescript
 * import {
 *   BootstrapClient,
 *   BotFatherManager,
 *   GroupManager,
 *   TopicManager,
 * } from '@mks2508/telegram-bot-manager';
 *
 * // Create and connect client
 * const client = new BootstrapClient({
 *   apiId: 12345,
 *   apiHash: 'your_api_hash'
 * });
 * await client.ensureAuthorized();
 *
 * // Create a bot
 * const botFather = new BotFatherManager(client);
 * const result = await botFather.createBot({
 *   botName: 'My Bot',
 *   botUsername: 'mybot123bot'
 * });
 *
 * if (result.isOk()) {
 *   console.log('Bot created:', result.value.botToken);
 * }
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// Core Classes
// =============================================================================

/**
 * GramJS client wrapper for Telegram MTProto operations.
 *
 * @example
 * ```typescript
 * const client = new BootstrapClient({
 *   apiId: 12345,
 *   apiHash: 'your_api_hash'
 * });
 * await client.ensureAuthorized();
 * ```
 */
export { BootstrapClient } from './client.js'

/**
 * BotFather automation manager.
 *
 * @example
 * ```typescript
 * const botFather = new BotFatherManager(client);
 * const bots = await botFather.listBots();
 * ```
 */
export { BotFatherManager } from './bot-father/index.js'

/**
 * Group and forum management.
 *
 * @example
 * ```typescript
 * const groupManager = new GroupManager(client);
 * const forums = await groupManager.getUserForums();
 * ```
 */
export { GroupManager } from './group-manager.js'

/**
 * Topic management for forum groups.
 *
 * @example
 * ```typescript
 * const topicManager = new TopicManager(client);
 * await topicManager.createTopic({ chatId, name: 'Logs' });
 * ```
 */
export { TopicManager } from './topic-manager.js'

/**
 * Multibot environment configuration manager.
 *
 * @example
 * ```typescript
 * const envManager = new EnvManager();
 * const bots = envManager.listBots();
 * ```
 */
export { EnvManager } from './env-manager.js'

/**
 * Interactive bootstrap state manager.
 *
 * @example
 * ```typescript
 * const state = new BootstrapState();
 * state.initialize({ environment: 'local', apiId, apiHash });
 * ```
 */
export { BootstrapState } from './bootstrap-state.js'

// =============================================================================
// Types - Re-export all from types/
// =============================================================================

export * from './types/index.js'

// =============================================================================
// Configuration
// =============================================================================

/**
 * Configuration loaders and utilities.
 *
 * @example
 * ```typescript
 * import { getDefaultCommands, loadCommandsConfig } from '@mks2508/telegram-bot-manager';
 *
 * const commands = getDefaultCommands();
 * // Or load from custom file
 * const custom = loadCommandsConfig('./my-commands.json');
 * ```
 */
export {
  loadCommandsConfig,
  loadTopicsConfig,
  getDefaultCommands,
  type ICommandsConfigFile,
} from './config/index.js'

// =============================================================================
// Utilities (internal, but exported for advanced use)
// =============================================================================

// These will be added after refactoring internal modules
// export { MessageHandler } from './bot-father/message-handler.js'
// export { ButtonHandler } from './bot-father/button-handler.js'
