/**
 * Configuration loader for telegram-bot-manager.
 *
 * @module
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { IBotCommand, ITopicsConfigFile, ITopicConfig } from '../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Commands configuration file structure.
 */
export interface ICommandsConfigFile {
  $schema: string
  description?: string
  commands: IBotCommand[]
}

/**
 * Load commands configuration from JSON file.
 *
 * @example
 * ```typescript
 * // Load default commands
 * const commands = loadCommandsConfig();
 *
 * // Load custom commands file
 * const customCommands = loadCommandsConfig('./my-commands.json');
 * ```
 *
 * @param path - Optional custom path to commands.json
 * @returns Commands configuration or null if file not found
 */
export function loadCommandsConfig(path?: string): ICommandsConfigFile | null {
  const configPath = path ?? resolve(__dirname, 'commands.json')

  if (!existsSync(configPath)) {
    return null
  }

  try {
    const content = readFileSync(configPath, 'utf-8')
    return JSON.parse(content) as ICommandsConfigFile
  } catch {
    return null
  }
}

/**
 * Get default bot commands.
 *
 * @example
 * ```typescript
 * const commands = getDefaultCommands();
 * await botFather.setCommands('mybot', commands);
 * ```
 *
 * @returns Array of default bot commands
 */
export function getDefaultCommands(): IBotCommand[] {
  const config = loadCommandsConfig()
  return config?.commands ?? [
    { command: 'start', description: 'Start the bot' },
    { command: 'health', description: 'Check bot health' },
    { command: 'help', description: 'Get help' },
  ]
}

/**
 * Load topics configuration from JSON file.
 *
 * @example
 * ```typescript
 * // Load default topics
 * const topics = loadTopicsConfig();
 *
 * // Load custom topics file
 * const customTopics = loadTopicsConfig('./my-topics.json');
 * ```
 *
 * @param path - Optional custom path to topics.json
 * @returns Topics configuration or null if file not found
 */
export function loadTopicsConfig(path?: string): ITopicsConfigFile | null {
  const configPath = path ?? resolve(__dirname, 'topics.json')

  if (!existsSync(configPath)) {
    return null
  }

  try {
    const content = readFileSync(configPath, 'utf-8')
    return JSON.parse(content) as ITopicsConfigFile
  } catch {
    return null
  }
}

/**
 * Get default forum topics.
 *
 * @example
 * ```typescript
 * const topics = getDefaultTopics();
 * for (const topic of topics) {
 *   await topicManager.createTopic({ chatId, name: topic.name });
 * }
 * ```
 *
 * @param requiredOnly - If true, only return required topics
 * @returns Array of default topic configurations
 */
export function getDefaultTopics(requiredOnly = false): ITopicConfig[] {
  const config = loadTopicsConfig()
  const topics = config?.topics ?? [
    { name: 'General', required: true, envKey: 'TG_GENERAL_TOPIC_ID' },
    { name: 'Control', required: true, envKey: 'TG_CONTROL_TOPIC_ID' },
    { name: 'Logs', required: true, envKey: 'TG_LOG_TOPIC_ID' },
  ]

  if (requiredOnly) {
    return topics.filter(t => t.required)
  }

  return topics
}
