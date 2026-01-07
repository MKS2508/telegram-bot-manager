import { existsSync, readFileSync, writeFileSync, unlinkSync, readdirSync, mkdirSync, statSync, readlinkSync } from 'fs'
import { dirname, resolve, join } from 'path'
import { symlink } from 'fs/promises'
import { Environment, type EnvConfig } from '../../../core/src/config/env.js'

/**
 * Bot configuration metadata
 */
export interface BotMetadata {
  username: string
  name: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  environments: Environment[]
  description?: string
  tags?: string[]
}

/**
 * Configured bot information
 */
export interface ConfiguredBot {
  username: string
  hasLocal: boolean
  hasStaging: boolean
  hasProduction: boolean
  isActive: boolean
  metadata: BotMetadata | null
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean
  migrated: string[]
  errors?: string[]
}

/**
 * Environment Manager for multibot configurations
 */
export class EnvManager {
  private readonly envsDir: string
  private readonly activeSymlink: string
  private readonly coreDir: string

  constructor(options?: { baseDir?: string; coreDir?: string }) {
    this.coreDir = options?.coreDir ?? resolve(process.cwd(), 'core')
    this.envsDir = resolve(this.coreDir, '.envs')
    this.activeSymlink = resolve(this.envsDir, '.active')

    this.ensureEnvsDir()
  }

  /**
   * Ensure .envs directory exists
   */
  private ensureEnvsDir(): void {
    if (!existsSync(this.envsDir)) {
      mkdirSync(this.envsDir, { recursive: true })
    }

    // Create .gitkeep
    const gitkeepPath = resolve(this.envsDir, '.gitkeep')
    if (!existsSync(gitkeepPath)) {
      writeFileSync(gitkeepPath, '', 'utf-8')
    }
  }

  /**
   * List all configured bots
   */
  listBots(): ConfiguredBot[] {
    if (!existsSync(this.envsDir)) {
      return []
    }

    const entries = readdirSync(this.envsDir, { withFileTypes: true })
    const activeBot = this.getActiveBot()

    return entries
      .filter((entry) => entry.isDirectory() && entry.name !== '.gitkeep')
      .map((dir) => {
        const botUsername = dir.name
        const botPath = resolve(this.envsDir, botUsername)

        return {
          username: botUsername,
          hasLocal: existsSync(resolve(botPath, 'local.env')),
          hasStaging: existsSync(resolve(botPath, 'staging.env')),
          hasProduction: existsSync(resolve(botPath, 'production.env')),
          isActive: activeBot === botUsername,
          metadata: this.getMetadata(botUsername),
        }
      })
  }

  /**
   * Get active bot username
   */
  getActiveBot(): string | null {
    try {
      if (existsSync(this.activeSymlink)) {
        const target = readlinkSync(this.activeSymlink)
        return target
      }
    } catch {
      // Symlink might be broken
    }
    return null
  }

  /**
   * Set active bot
   */
  async setActiveBot(botUsername: string): Promise<void> {
    const botPath = resolve(this.envsDir, botUsername)

    if (!existsSync(botPath)) {
      throw new Error(`Bot '${botUsername}' does not exist`)
    }

    // Remove existing symlink
    if (existsSync(this.activeSymlink)) {
      unlinkSync(this.activeSymlink)
    }

    // Create new symlink
    await symlink(botUsername, this.activeSymlink)
  }

  /**
   * Check if bot exists
   */
  botExists(botUsername: string): boolean {
    const botPath = resolve(this.envsDir, botUsername)
    return existsSync(botPath)
  }

  /**
   * Get .env path for bot + environment
   */
  getEnvPath(botUsername: string, environment: Environment): string {
    return resolve(this.envsDir, botUsername, `${environment}.env`)
  }

  /**
   * Create bot directory
   */
  private createBotDirectory(botUsername: string): void {
    const botPath = resolve(this.envsDir, botUsername)
    if (!existsSync(botPath)) {
      mkdirSync(botPath, { recursive: true })
    }
  }

  /**
   * Create .env file for bot + environment
   */
  async createEnv(
    botUsername: string,
    environment: Environment,
    config: Partial<EnvConfig>
  ): Promise<void> {
    this.createBotDirectory(botUsername)

    const envPath = this.getEnvPath(botUsername, environment)
    const content = this.configToEnvString(config)

    writeFileSync(envPath, content, 'utf-8')

    // Update metadata
    const metadata = this.getMetadata(botUsername) || this.createDefaultMetadata(botUsername)
    if (!metadata.environments.includes(environment)) {
      metadata.environments.push(environment)
      metadata.updatedAt = new Date().toISOString()
      this.updateMetadata(botUsername, metadata)
    }
  }

  /**
   * Read .env file for bot + environment
   */
  async readEnv(botUsername: string, environment: Environment): Promise<Partial<EnvConfig>> {
    const envPath = this.getEnvPath(botUsername, environment)

    if (!existsSync(envPath)) {
      throw new Error(`Environment file not found: ${envPath}`)
    }

    const content = readFileSync(envPath, 'utf-8')
    return this.envStringToConfig(content)
  }

  /**
   * Update .env file for bot + environment
   */
  async updateEnv(
    botUsername: string,
    environment: Environment,
    updates: Partial<EnvConfig>
  ): Promise<void> {
    const envPath = this.getEnvPath(botUsername, environment)

    let currentConfig: Partial<EnvConfig> = {}
    if (existsSync(envPath)) {
      currentConfig = await this.readEnv(botUsername, environment)
    }

    const mergedConfig = { ...currentConfig, ...updates }
    const content = this.configToEnvString(mergedConfig)

    writeFileSync(envPath, content, 'utf-8')

    // Update metadata
    const metadata = this.getMetadata(botUsername)
    if (metadata) {
      metadata.updatedAt = new Date().toISOString()
      this.updateMetadata(botUsername, metadata)
    }
  }

  /**
   * Delete bot configuration
   */
  async deleteBot(botUsername: string): Promise<void> {
    const botPath = resolve(this.envsDir, botUsername)

    if (!existsSync(botPath)) {
      throw new Error(`Bot '${botUsername}' does not exist`)
    }

    // Check if it's the active bot
    if (this.getActiveBot() === botUsername) {
      // Remove symlink
      if (existsSync(this.activeSymlink)) {
        unlinkSync(this.activeSymlink)
      }
    }

    // Recursively delete bot directory
    const rimraf = (path: string) => {
      if (existsSync(path)) {
        const entries = readdirSync(path, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = resolve(path, entry.name)
          if (entry.isDirectory()) {
            rimraf(fullPath)
          } else {
            unlinkSync(fullPath)
          }
        }
        const stat = statSync(path)
        if (stat.isDirectory()) {
          // @ts-ignore - rmdirSync exists
          // biome-ignore lint: rmdirSync is deprecated but still works
          // eslint-disable-next-line
        }
      }
    }

    rimraf(botPath)
  }

  /**
   * Migrate old .env.{environment} to .envs structure
   */
  async migrateOldEnvs(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migrated: [],
      errors: [],
    }

    const environments: Environment[] = [
      Environment.LOCAL,
      Environment.STAGING,
      Environment.PRODUCTION,
    ]

    for (const env of environments) {
      const oldEnvPath = resolve(this.coreDir, `.env.${env}`)

      if (!existsSync(oldEnvPath)) {
        continue
      }

      try {
        // Read old .env file
        const content = readFileSync(oldEnvPath, 'utf-8')
        const config = this.envStringToConfig(content)

        // Try to extract bot username from token or use default
        let botUsername = 'mks-bot'
        if (config.botToken) {
          // For now, use a default or extract from token if possible
          // TODO: Could call getMe API to get actual username
          botUsername = `migrated-bot-${env}`
        }

        // Create new structure
        await this.createEnv(botUsername, env, config)

        // Backup old file
        const backupPath = resolve(this.coreDir, `.env.${env}.backup`)
        writeFileSync(backupPath, content, 'utf-8')

        // Delete old file
        unlinkSync(oldEnvPath)

        result.migrated.push(botUsername)

        // Set as active if local
        if (env === Environment.LOCAL) {
          await this.setActiveBot(botUsername)
        }
      } catch (error) {
        result.errors?.push(
          `Failed to migrate .env.${env}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    result.success = (result.errors?.length ?? 0) === 0
    return result
  }

  /**
   * Get bot metadata
   */
  getMetadata(botUsername: string): BotMetadata | null {
    const metadataPath = resolve(this.envsDir, botUsername, 'metadata.json')

    if (!existsSync(metadataPath)) {
      return null
    }

    try {
      const content = readFileSync(metadataPath, 'utf-8')
      return JSON.parse(content) as BotMetadata
    } catch {
      return null
    }
  }

  /**
   * Update bot metadata
   */
  async updateMetadata(botUsername: string, metadata: Partial<BotMetadata>): Promise<void> {
    this.createBotDirectory(botUsername)

    const metadataPath = resolve(this.envsDir, botUsername, 'metadata.json')
    const existing = this.getMetadata(botUsername) || this.createDefaultMetadata(botUsername)

    const updated = { ...existing, ...metadata, updatedAt: new Date().toISOString() }

    writeFileSync(metadataPath, JSON.stringify(updated, null, 2), 'utf-8')
  }

  /**
   * Create default metadata for a bot
   */
  private createDefaultMetadata(botUsername: string): BotMetadata {
    return {
      username: botUsername,
      name: botUsername.replace(/bot$/, '').replace(/_/g, ' ').replace(/-/g, ' '),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      environments: [],
    }
  }

  /**
   * Convert config object to .env string format
   */
  private configToEnvString(config: Partial<EnvConfig>): string {
    const lines: string[] = []

    if (config.botToken) lines.push(`TG_BOT_TOKEN=${config.botToken}`)
    if (config.mode) lines.push(`TG_MODE=${config.mode}`)
    if (config.webhookUrl) lines.push(`TG_WEBHOOK_URL=${config.webhookUrl}`)
    if (config.webhookSecret) lines.push(`TG_WEBHOOK_SECRET=${config.webhookSecret}`)
    if (config.logChatId) lines.push(`TG_LOG_CHAT_ID=${config.logChatId}`)
    if (config.logTopicId) lines.push(`TG_LOG_TOPIC_ID=${config.logTopicId}`)
    if (config.controlChatId) lines.push(`TG_CONTROL_CHAT_ID=${config.controlChatId}`)
    if (config.controlTopicId) lines.push(`TG_CONTROL_TOPIC_ID=${config.controlTopicId}`)
    if (config.logLevel) lines.push(`LOG_LEVEL=${config.logLevel}`)

    if (config.environment) lines.push(`TG_ENV=${config.environment}`)
    if (config.instanceName) lines.push(`TG_INSTANCE_NAME=${config.instanceName}`)
    if (config.instanceId) lines.push(`TG_INSTANCE_ID=${config.instanceId}`)

    if (config.instanceCheck !== undefined) lines.push(`TG_INSTANCE_CHECK=${config.instanceCheck}`)
    if (config.lockBackend) lines.push(`TG_LOCK_BACKEND=${config.lockBackend}`)
    if (config.redisUrl) lines.push(`TG_REDIS_URL=${config.redisUrl}`)

    if (config.ngrokEnabled !== undefined) lines.push(`TG_NGROK_ENABLED=${config.ngrokEnabled}`)
    if (config.ngrokPort !== undefined) lines.push(`TG_NGROK_PORT=${config.ngrokPort}`)
    if (config.ngrokDomain) lines.push(`TG_NGROK_DOMAIN=${config.ngrokDomain}`)
    if (config.ngrokRegion) lines.push(`TG_NGROK_REGION=${config.ngrokRegion}`)
    if (config.ngrokAuthToken) lines.push(`TG_NGROK_AUTH_TOKEN=${config.ngrokAuthToken}`)

    return lines.join('\n')
  }

  /**
   * Parse .env string to config object
   */
  private envStringToConfig(content: string): Partial<EnvConfig> {
    const config: Partial<EnvConfig> = {}
    const lines = content.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=')

      switch (key) {
        case 'TG_BOT_TOKEN':
          config.botToken = value
          break
        case 'TG_MODE':
          config.mode = value as 'polling' | 'webhook'
          break
        case 'TG_WEBHOOK_URL':
          config.webhookUrl = value
          break
        case 'TG_WEBHOOK_SECRET':
          config.webhookSecret = value
          break
        case 'TG_LOG_CHAT_ID':
          config.logChatId = value
          break
        case 'TG_LOG_TOPIC_ID':
          config.logTopicId = Number.parseInt(value, 10)
          break
        case 'TG_CONTROL_CHAT_ID':
          config.controlChatId = value
          break
        case 'TG_CONTROL_TOPIC_ID':
          config.controlTopicId = Number.parseInt(value, 10)
          break
        case 'LOG_LEVEL':
          config.logLevel = value as 'debug' | 'info' | 'warn' | 'error'
          break
        case 'TG_ENV':
          config.environment = value as Environment
          break
        case 'TG_INSTANCE_NAME':
          config.instanceName = value
          break
        case 'TG_INSTANCE_ID':
          config.instanceId = value
          break
        case 'TG_INSTANCE_CHECK':
          config.instanceCheck = value.toLowerCase() === 'true'
          break
        case 'TG_LOCK_BACKEND':
          config.lockBackend = value as 'pid' | 'redis'
          break
        case 'TG_REDIS_URL':
          config.redisUrl = value
          break
        case 'TG_NGROK_ENABLED':
          config.ngrokEnabled = value.toLowerCase() === 'true'
          break
        case 'TG_NGROK_PORT':
          config.ngrokPort = Number.parseInt(value, 10)
          break
        case 'TG_NGROK_DOMAIN':
          config.ngrokDomain = value
          break
        case 'TG_NGROK_REGION':
          config.ngrokRegion = value
          break
        case 'TG_NGROK_AUTH_TOKEN':
          config.ngrokAuthToken = value
          break
      }
    }

    return config
  }
}
