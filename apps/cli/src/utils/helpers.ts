/**
 * Helper utilities for CLI commands.
 *
 * @module
 */

import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { input, confirm } from '@inquirer/prompts'
import { cliLogger, printTitle } from './logger.js'

/**
 * API credentials for Telegram MTProto.
 */
export interface IApiCredentials {
  apiId: number
  apiHash: string
  saveToEnv: boolean
}

/**
 * Sleep for a specified number of milliseconds.
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 *
 * @example
 * ```typescript
 * await sleep(2000) // Wait 2 seconds
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Update or add an environment variable in .env content.
 *
 * @param content - Current .env file content
 * @param key - Environment variable name
 * @param value - Environment variable value
 * @returns Updated .env content
 *
 * @example
 * ```typescript
 * const newContent = updateEnvVar(envContent, 'TG_BOT_TOKEN', 'abc123')
 * ```
 */
export function updateEnvVar(content: string, key: string, value: string): string {
  const exists = new RegExp(`^${key}=(.+)$`, 'm').test(content)

  if (exists) {
    return content.replace(new RegExp(`^${key}=(.+)$`, 'm'), `${key}=${value}`)
  }

  const commentedMatch = content.match(new RegExp(`^#\\s*${key}=(.+)$`, 'm'))
  if (commentedMatch) {
    return content.replace(new RegExp(`^#\\s*${key}=(.+)$`, 'm'), `${key}=${value}`)
  }

  return content.trimEnd() + `\n${key}=${value}\n`
}

/**
 * Get API credentials from environment or prompt user.
 *
 * @param fromEnv - Whether credentials are available in environment
 * @param envApiId - API ID from environment (if available)
 * @param envApiHash - API Hash from environment (if available)
 * @returns API credentials or null if cancelled
 *
 * @example
 * ```typescript
 * const credentials = await getApiCredentials(false)
 * if (!credentials) {
 *   cliLogger.error('Cancelled')
 *   return
 * }
 * ```
 */
export async function getApiCredentials(
  fromEnv: boolean,
  envApiId?: string,
  envApiHash?: string
): Promise<IApiCredentials | null> {
  if (fromEnv && envApiId && envApiHash) {
    const apiId = parseInt(envApiId, 10)
    if (isNaN(apiId)) {
      cliLogger.error('Invalid TG_API_ID in environment file. Must be a number.')
      return null
    }
    return { apiId, apiHash: envApiHash, saveToEnv: false }
  }

  printTitle('📱 Telegram MTProto API Credentials')

  cliLogger.info('To create bots and groups automatically, you need MTProto API credentials.')
  cliLogger.info('')
  cliLogger.info('📋 STEP-BY-STEP GUIDE:')
  cliLogger.info('')
  cliLogger.info('1. Open https://my.telegram.org in your browser')
  cliLogger.info('2. Log in with your phone number')
  cliLogger.info('3. Click on "API development tools"')
  cliLogger.info('4. Fill in the form:')
  cliLogger.info('   - App title: My Bot App')
  cliLogger.info('   - Short name: mybotapp')
  cliLogger.info('   - Platform: Desktop or Web')
  cliLogger.info('5. Click "Create application"')
  cliLogger.info('6. Copy the api_id and api_hash')
  cliLogger.info('')

  const useEnv = await confirm({
    message: 'Save API credentials to .env file for future use?',
    default: true,
  })

  const apiId = await input({
    message: 'Enter your API ID:',
    validate: (value: string) => {
      const num = parseInt(value, 10)
      if (isNaN(num)) return 'API ID must be a number'
      if (num < 1) return 'API ID must be positive'
      return true
    },
  })

  const apiHash = await input({
    message: 'Enter your API Hash:',
    validate: (value: string) => {
      if (!value || value.trim().length === 0) return 'API Hash is required'
      if (value.trim().length < 32) return 'API Hash seems too short (should be 32+ characters)'
      return true
    },
  })

  cliLogger.info('')
  cliLogger.info('🔐 Next: TELEGRAM LOGIN')
  cliLogger.info('')
  cliLogger.info('After you enter your credentials, you will need to:')
  cliLogger.info('1. Enter your phone number (with country code)')
  cliLogger.info('2. Enter the verification code from Telegram')
  cliLogger.info('3. Enter your 2FA password (if enabled)')
  cliLogger.info('')

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
 * Try to load API credentials from various env file locations.
 *
 * @param environment - Target environment (local, staging, production)
 * @returns Object with apiId and apiHash if found, or empty strings
 *
 * @example
 * ```typescript
 * const { apiId, apiHash } = await loadApiCredentialsFromEnv('local')
 * ```
 */
export async function loadApiCredentialsFromEnv(
  environment: string
): Promise<{ apiId: string; apiHash: string }> {
  let apiId = ''
  let apiHash = ''

  const envFile = resolve(process.cwd(), 'core', `.env.${environment}`)
  if (existsSync(envFile)) {
    const content = await readFile(envFile, 'utf-8')
    const apiIdMatch = content.match(/^TG_API_ID=(.+)$/m)
    const apiHashMatch = content.match(/^TG_API_HASH=(.+)$/m)
    apiId = apiIdMatch?.[1]?.trim() ?? ''
    apiHash = apiHashMatch?.[1]?.trim() ?? ''
  }

  return { apiId, apiHash }
}

/**
 * Get the environment variable key for a topic name.
 *
 * @param topicName - Name of the topic
 * @returns Environment variable key or null if not mapped
 *
 * @example
 * ```typescript
 * const key = getEnvKeyForTopic('Control')
 * // Returns 'TG_CONTROL_TOPIC_ID'
 * ```
 */
export function getEnvKeyForTopic(topicName: string): string | null {
  switch (topicName.toLowerCase()) {
    case 'control':
      return 'TG_CONTROL_TOPIC_ID'
    case 'logs':
    case 'log':
      return 'TG_LOG_TOPIC_ID'
    case 'general':
      return 'TG_GENERAL_TOPIC_ID'
    case 'config':
      return 'TG_CONFIG_TOPIC_ID'
    case 'bugs':
      return 'TG_BUGS_TOPIC_ID'
    default:
      return null
  }
}

/**
 * Get a random color for topic icons.
 *
 * @returns A valid Telegram topic icon color
 *
 * @example
 * ```typescript
 * const color = getRandomTopicColor()
 * ```
 */
export function getRandomTopicColor(): number {
  const colors = [
    0x6FB9F0, // Blue
    0xFFD67E, // Yellow
    0xCB86DB, // Purple
    0x8EEE98, // Green
    0xFF93B2, // Pink
    0xFB6F5F, // Red
  ]
  return colors[Math.floor(Math.random() * colors.length)]!
}

/**
 * Update .env file with topic IDs.
 *
 * @param envFile - Path to the .env file
 * @param topics - Array of created topics
 *
 * @example
 * ```typescript
 * await updateEnvWithTopics(envFile, [
 *   { name: 'Control', threadId: 123 },
 *   { name: 'Logs', threadId: 456 },
 * ])
 * ```
 */
export async function updateEnvWithTopics(
  envFile: string,
  topics: Array<{ name: string; threadId: number }>
): Promise<void> {
  let content = await readFile(envFile, 'utf-8')

  for (const topic of topics) {
    const envKey = getEnvKeyForTopic(topic.name)
    if (envKey) {
      content = updateEnvVar(content, envKey, String(topic.threadId))
    }
  }

  await writeFile(envFile, content, 'utf-8')
}
