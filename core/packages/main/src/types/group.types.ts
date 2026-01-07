/**
 * Group and Forum management types.
 *
 * Types for creating and managing Telegram supergroups and forums.
 *
 * @module
 */

// =============================================================================
// Group Creation
// =============================================================================

/**
 * Options for creating a supergroup/forum.
 *
 * @example
 * ```typescript
 * const options: ICreateSupergroupOptions = {
 *   title: 'My Bot Control Group',
 *   description: 'Control panel for my bot',
 *   forumMode: true
 * };
 * ```
 */
export interface ICreateSupergroupOptions {
  /** Group title */
  title: string
  /** Group description */
  description?: string
  /** Enable forum mode with topics (default: true) */
  forumMode?: boolean
}

/**
 * Result data from group creation.
 *
 * @example
 * ```typescript
 * if (result.isOk()) {
 *   console.log('Chat ID:', result.value.chatId);
 *   console.log('Title:', result.value.title);
 * }
 * ```
 */
export interface IGroupCreationData {
  /** Chat ID in format -100xxxxxxxxxx */
  chatId: number
  /** Group title */
  title: string
  /** Invite link (if generated) */
  inviteLink?: string
}

// =============================================================================
// Forum Information
// =============================================================================

/**
 * Information about a forum/supergroup.
 *
 * @example
 * ```typescript
 * const forums = await groupManager.getUserForums();
 * forums.forEach(forum => {
 *   console.log(`${forum.title} (${forum.isForum ? 'Forum' : 'Group'})`);
 * });
 * ```
 */
export interface IForumGroupInfo {
  /** Chat ID in format -100xxxxxxxxxx */
  id: number
  /** Raw channel ID (without -100 prefix) */
  channelId: number
  /** Group title */
  title: string
  /** Group username if public */
  username?: string
  /** Whether forum mode is enabled */
  isForum: boolean
  /** Number of members */
  memberCount?: number
  /** Access hash for API calls */
  accessHash: bigint
}

/**
 * Information about a forum topic.
 *
 * @example
 * ```typescript
 * const topics = await groupManager.getForumTopics(chatId);
 * topics.forEach(topic => {
 *   console.log(`${topic.name} [ID: ${topic.id}]`);
 * });
 * ```
 */
export interface IForumTopicInfo {
  /** Topic ID (message_thread_id) */
  id: number
  /** Topic name */
  name: string
  /** Topic icon color */
  iconColor?: number
  /** Custom emoji ID for topic icon */
  iconEmojiId?: string
  /** Whether topic is closed */
  isClosed: boolean
  /** Whether topic is pinned */
  isPinned: boolean
}

// =============================================================================
// Bot Admin Permissions
// =============================================================================

/**
 * Admin permissions to grant when adding a bot to a group.
 *
 * @example
 * ```typescript
 * const permissions: IBotAdminPermissions = {
 *   canManageTopics: true,
 *   canDeleteMessages: true,
 *   canPinMessages: true
 * };
 * ```
 */
export interface IBotAdminPermissions {
  /** Can manage forum topics */
  canManageTopics?: boolean
  /** Can delete messages */
  canDeleteMessages?: boolean
  /** Can edit messages */
  canEditMessages?: boolean
  /** Can invite users */
  canInviteUsers?: boolean
  /** Can ban users */
  canBanUsers?: boolean
  /** Can pin messages */
  canPinMessages?: boolean
}

// =============================================================================
// Chat Information
// =============================================================================

/**
 * Basic chat information.
 */
export interface IChatInfo {
  /** Chat title */
  title: string
  /** Chat type */
  type: 'group' | 'supergroup' | 'channel'
  /** Whether forum mode is enabled */
  isForum: boolean
}
