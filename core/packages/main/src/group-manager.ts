import type { BootstrapClient } from './client.js'
import bigInt, { type BigInteger } from 'big-integer'

/**
 * Helper to convert number/bigint to BigInteger for GramJS
 */
function toBigInteger(value: number | bigint): BigInteger {
  return bigInt(value.toString())
}

/**
 * Result of group creation
 */
export interface GroupCreationResult {
  success: boolean
  chatId?: number
  title?: string
  inviteLink?: string
  error?: string
}

/**
 * Options for creating a supergroup
 */
export interface CreateSupergroupOptions {
  title: string
  description?: string
  forumMode?: boolean
}

/**
 * Admin permissions for bot
 */
export interface BotAdminPermissions {
  canManageTopics?: boolean
  canDeleteMessages?: boolean
  canEditMessages?: boolean
  canInviteUsers?: boolean
  canBanUsers?: boolean
  canPinMessages?: boolean
}

/**
 * Forum/Supergroup information
 */
export interface ForumGroupInfo {
  id: number
  channelId: number
  title: string
  username?: string
  isForum: boolean
  memberCount?: number
  accessHash: bigint
}

/**
 * Forum topic information
 */
export interface ForumTopicInfo {
  id: number
  name: string
  iconColor?: number
  iconEmojiId?: string
  isClosed: boolean
  isPinned: boolean
}

/**
 * Group manager for creating and managing Telegram groups
 */
export class GroupManager {
  constructor(private client: BootstrapClient) {}

  /**
   * Create a new supergroup (megagroup/forum)
   * @param options Supergroup creation options
   * @returns Group creation result
   */
  async createSupergroup(options: CreateSupergroupOptions): Promise<GroupCreationResult> {
    const tgClient = this.client.getClient()

    try {
      const { Api } = await import('telegram/tl/index.js')

      // @ts-ignore - CreateChannel exists but type might be different
      const result = await tgClient.invoke(new Api.channels.CreateChannel({
        title: options.title,
        about: options.description || '',
        megagroup: true,
        forum: options.forumMode ?? true,
      }))

      // Extract chat ID from result.chats array
      // GramJS returns Api.TypeUpdates with structure: { chats: Api.TypeChat[], ... }
      let chatId: number | undefined
      // @ts-ignore - result structure is Api.Updates with chats array
      if (result?.chats && Array.isArray(result.chats) && result.chats.length > 0) {
        // @ts-ignore
        const channel = result.chats[0]
        let rawChannelId: number

        // Handle different ID formats (bigint, BigInteger from big-integer lib)
        if (typeof channel.id === 'bigint') {
          rawChannelId = Number(channel.id)
        } else if (typeof channel.id === 'object' && 'value' in channel.id) {
          rawChannelId = Number(channel.id.value.toString())
        } else {
          rawChannelId = Number(channel.id)
        }

        // For supergroups/channels, chat ID format is -100{channelId}
        chatId = -Number(`100${rawChannelId}`)
      }

      return {
        success: true,
        chatId,
        title: options.title,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Add bot to group as administrator
   * @param chatId The group chat ID (negative, like -1001234567890)
   * @param botUsername The bot username (without @)
   * @param permissions Admin permissions to grant
   */
  async addBotAsAdmin(
    chatId: number,
    botUsername: string,
    permissions: BotAdminPermissions = {}
  ): Promise<{ success: boolean; error?: string }> {
    const tgClient = this.client.getClient()

    try {
      // Get channel entity to fetch access hash
      const channelEntity = await this.getChannelEntity(chatId)
      if (!channelEntity) {
        return { success: false, error: 'Could not resolve channel entity' }
      }

      // Resolve the bot username
      const botEntity = await tgClient.getEntity(botUsername)
      if (!botEntity) {
        return { success: false, error: 'Could not resolve bot entity' }
      }

      const { Api } = await import('telegram/tl/index.js')

      // @ts-ignore - EditAdmin exists but type might be incomplete
      await tgClient.invoke(new Api.channels.EditAdmin({
        // @ts-ignore - InputPeerChannel constructor exists
        channel: new Api.InputPeerChannel({
          channelId: toBigInteger(this.extractChannelId(chatId)),
          accessHash: toBigInteger(channelEntity.accessHash),
        }),
        userId: botEntity,
        adminRights: new Api.ChatAdminRights({
          anonymous: false,
          manageTopics: permissions.canManageTopics ?? true,
          deleteMessages: permissions.canDeleteMessages ?? true,
          editMessages: permissions.canEditMessages ?? false,
          inviteUsers: permissions.canInviteUsers ?? true,
          banUsers: permissions.canBanUsers ?? true,
          pinMessages: permissions.canPinMessages ?? true,
          addAdmins: false,
          manageCall: false,
          other: false,
          changeInfo: true,
        }),
        rank: 'Bot',
      }))

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Get invite link for a group
   * @param chatId The group chat ID
   */
  async getInviteLink(chatId: number): Promise<{ success: boolean; link?: string; error?: string }> {
    const tgClient = this.client.getClient()

    try {
      // Get channel entity to fetch access hash
      const channelEntity = await this.getChannelEntity(chatId)
      if (!channelEntity) {
        return { success: false, error: 'Could not resolve channel entity' }
      }

      const { Api } = await import('telegram/tl/index.js')

      // @ts-ignore - ExportInvite exists but type might be incomplete
      const result = await tgClient.invoke(new Api.channels.ExportInvite({
        // @ts-ignore - InputPeerChannel constructor exists
        channel: new Api.InputPeerChannel({
          channelId: toBigInteger(this.extractChannelId(chatId)),
          accessHash: toBigInteger(channelEntity.accessHash),
        }),
      }))

      return {
        success: true,
        // @ts-ignore - link property exists
        link: result?.link ?? undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Get chat information
   * @param chatId The chat ID
   */
  async getChatInfo(chatId: number): Promise<{
    success: boolean
    title?: string
    type?: string
    isForum?: boolean
    error?: string
  }> {
    const tgClient = this.client.getClient()

    try {
      const entity = await tgClient.getEntity(chatId)

      if (!entity) {
        return {
          success: false,
          error: 'Could not resolve entity',
        }
      }

      // @ts-ignore - className exists at runtime
      if (entity.className === 'Channel' || entity.className === 'ChannelForbidden') {
        const channel = entity as any
        return {
          success: true,
          title: channel.title ?? undefined,
          type: channel.megagroup ? 'supergroup' : 'channel',
          isForum: channel.forum ?? false,
        }
      }
      // @ts-ignore
      else if (entity.className === 'Chat') {
        const chat = entity as any
        return {
          success: true,
          title: chat.title ?? undefined,
          type: 'group',
          isForum: false,
        }
      }

      return {
        success: false,
        error: 'Unknown chat type',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Get channel entity with access hash
   * @param chatId The chat ID
   */
  private async getChannelEntity(chatId: number): Promise<{ accessHash: bigint } | null> {
    const tgClient = this.client.getClient()

    try {
      const entity = await tgClient.getEntity(chatId)

      // Check if entity has accessHash
      if (entity && typeof entity === 'object' && 'accessHash' in entity) {
        const typedEntity = entity as { accessHash: bigint | any }
        const hash = typedEntity.accessHash

        // Return as bigint (native)
        if (typeof hash === 'bigint') {
          return { accessHash: hash }
        }

        // Convert BigInteger to bigint if needed
        if (hash && typeof hash === 'object' && 'value' in hash) {
          return { accessHash: BigInt(hash.value.toString()) }
        }

        return { accessHash: hash }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Extract channel ID from chat ID
   * Chat IDs for supergroups are like -1001234567890
   * Channel IDs are the positive part: 1234567890
   */
  private extractChannelId(chatId: number): number {
    // For supergroups, chatId is typically -100xxxxxx
    // We need the absolute value for channelId
    const abs = Math.abs(chatId)

    // If it starts with 100 (e.g., -1001234567890), strip the 100
    // to get the actual channel ID
    if (abs >= 1000000000 && abs.toString().startsWith('100')) {
      return parseInt(abs.toString().substring(3))
    }

    // Otherwise just return absolute value
    return abs
  }

  /**
   * Get all supergroups/forums the user is a member of
   */
  async getUserForums(): Promise<{
    success: boolean
    forums?: ForumGroupInfo[]
    error?: string
  }> {
    const tgClient = this.client.getClient()

    try {
      const dialogs = await tgClient.getDialogs({ limit: 100 })
      const forums: ForumGroupInfo[] = []

      for (const dialog of dialogs) {
        const entity = dialog.entity
        if (!entity) continue

        // @ts-ignore - className exists at runtime
        if (entity.className === 'Channel' && entity.megagroup) {
          // @ts-ignore
          const channel = entity

          // Only include groups where user is admin (adminRights exists only for admins)
          // @ts-ignore
          if (!channel.adminRights) {
            continue
          }

          // Extract channel ID
          let rawChannelId: number
          if (typeof channel.id === 'bigint') {
            rawChannelId = Number(channel.id)
          } else if (typeof channel.id === 'object' && 'value' in channel.id) {
            rawChannelId = Number((channel.id as { value: unknown }).value?.toString() || '0')
          } else {
            rawChannelId = Number(channel.id)
          }

          // Convert to chat ID format (-100xxx)
          const chatId = -Number(`100${rawChannelId}`)

          // Extract access hash
          let accessHash: bigint
          if (typeof channel.accessHash === 'bigint') {
            accessHash = channel.accessHash
          } else if (typeof channel.accessHash === 'object' && 'value' in channel.accessHash) {
            accessHash = BigInt((channel.accessHash as { value: unknown }).value?.toString() || '0')
          } else {
            accessHash = BigInt(channel.accessHash?.toString() || '0')
          }

          forums.push({
            id: chatId,
            channelId: rawChannelId,
            title: channel.title || 'Unknown',
            username: channel.username ?? undefined,
            isForum: channel.forum ?? false,
            memberCount: channel.participantsCount ?? undefined,
            accessHash,
          })
        }
      }

      return { success: true, forums }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Get all topics from a forum group
   * @param chatId The forum chat ID (with -100 prefix)
   */
  async getForumTopics(chatId: number): Promise<{
    success: boolean
    topics?: ForumTopicInfo[]
    error?: string
  }> {
    const tgClient = this.client.getClient()

    try {
      // Get channel entity to fetch access hash
      const channelEntity = await this.getChannelEntity(chatId)
      if (!channelEntity) {
        return { success: false, error: 'Could not resolve channel entity' }
      }

      const { Api } = await import('telegram/tl/index.js')

      // Extract raw channel ID from chat ID
      const rawChannelId = this.extractChannelId(chatId)

      // @ts-ignore - GetForumTopics exists
      const result = await tgClient.invoke(new Api.channels.GetForumTopics({
        channel: new Api.InputChannel({
          channelId: toBigInteger(rawChannelId),
          accessHash: toBigInteger(channelEntity.accessHash),
        }),
        offsetDate: 0,
        offsetId: 0,
        offsetTopic: 0,
        limit: 100,
      }))

      const topics: ForumTopicInfo[] = []

      // @ts-ignore - topics array exists in result
      if (result?.topics && Array.isArray(result.topics)) {
        for (const topic of result.topics) {
          // Skip deleted topics (ForumTopicDeleted doesn't have title)
          // @ts-ignore - className exists at runtime
          if (topic.className === 'ForumTopicDeleted' || !('title' in topic)) {
            continue
          }

          // @ts-ignore - we've verified this is a ForumTopic
          topics.push({
            id: Number(topic.id),
            name: topic.title || 'Unknown',
            iconColor: topic.iconColor ?? undefined,
            iconEmojiId: topic.iconEmojiId?.toString() ?? undefined,
            isClosed: topic.closed ?? false,
            isPinned: topic.pinned ?? false,
          })
        }
      }

      return { success: true, topics }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Delete a forum topic
   * Note: Cannot delete the default General topic (ID 1)
   * @param chatId The forum chat ID (with -100 prefix)
   * @param topicId The topic ID to delete
   */
  async deleteTopic(
    chatId: number,
    topicId: number
  ): Promise<{
    success: boolean
    error?: string
  }> {
    // Cannot delete default General topic
    if (topicId === 1) {
      return { success: false, error: 'Cannot delete default General topic (ID 1)' }
    }

    const tgClient = this.client.getClient()

    try {
      const channelEntity = await this.getChannelEntity(chatId)
      if (!channelEntity) {
        return { success: false, error: 'Could not resolve channel entity' }
      }

      const { Api } = await import('telegram/tl/index.js')
      const rawChannelId = this.extractChannelId(chatId)

      // @ts-ignore - DeleteTopicHistory exists
      await tgClient.invoke(
        new Api.channels.DeleteTopicHistory({
          channel: new Api.InputChannel({
            channelId: toBigInteger(rawChannelId),
            accessHash: toBigInteger(channelEntity.accessHash),
          }),
          topMsgId: topicId,
        })
      )

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}
