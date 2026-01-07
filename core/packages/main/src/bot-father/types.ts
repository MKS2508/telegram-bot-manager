import type { BootstrapClient } from '../client.js'

export type Message = any

export interface BotCreationResult {
  success: boolean
  botToken?: string
  botUsername?: string
  error?: string
}

export interface CreateBotOptions {
  botName: string
  botUsername: string
  description?: string
  about?: string
}

export interface BotInfo {
  username: string
  name: string
  token?: string
  description?: string
  about?: string
  canJoinGroups?: boolean
  canReadAllGroupMessages?: boolean
  supportsInlineQueries?: boolean
}

export interface BotListResult {
  success: boolean
  bots?: BotInfo[]
  error?: string
}

export interface BotInfoResult {
  success: boolean
  bot?: BotInfo
  error?: string
}

export interface BotFatherDependencies {
  client: BootstrapClient
  botFatherUsername: string
}
