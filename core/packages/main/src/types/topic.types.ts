/**
 * Topic management types.
 *
 * Types for creating and managing forum topics.
 *
 * @module
 */

// =============================================================================
// Topic Creation
// =============================================================================

/**
 * Options for creating a single topic.
 *
 * @example
 * ```typescript
 * const options: ICreateTopicOptions = {
 *   chatId: -1001234567890,
 *   name: 'Logs',
 *   iconColor: 0x6FB9F0
 * };
 * ```
 */
export interface ICreateTopicOptions {
  /** Chat ID of the forum */
  chatId: number
  /** Topic name */
  name: string
  /** Topic icon color (hex color as number) */
  iconColor?: number
  /** Custom emoji ID for topic icon */
  iconEmojiId?: string
}

/**
 * Result data from topic creation.
 *
 * @example
 * ```typescript
 * if (result.isOk()) {
 *   console.log('Topic ID:', result.value.threadId);
 * }
 * ```
 */
export interface ITopicCreationData {
  /** Topic thread ID (message_thread_id) */
  threadId: number
  /** Topic name */
  name: string
}

/**
 * Result from creating multiple topics.
 */
export interface ITopicsCreationData {
  /** Array of created topics */
  topics: ITopicCreationData[]
  /** Topics that failed to create */
  failed: Array<{ name: string; error: string }>
}

// =============================================================================
// Topic Configuration
// =============================================================================

/**
 * Topic configuration for bootstrap.
 *
 * Defines topics to create during bot setup.
 *
 * @example
 * ```typescript
 * const config: ITopicConfig = {
 *   name: 'Control',
 *   required: true,
 *   envKey: 'TG_CONTROL_TOPIC_ID'
 * };
 * ```
 */
export interface ITopicConfig {
  /** Topic name */
  name: string
  /** Whether this topic is required */
  required: boolean
  /** Environment variable key to store topic ID */
  envKey: string | null
  /** Topic icon color */
  iconColor?: number
}

/**
 * Topics configuration file schema.
 *
 * @example
 * ```json
 * {
 *   "schema": "1.0",
 *   "topics": [
 *     { "name": "General", "required": true, "envKey": null },
 *     { "name": "Control", "required": true, "envKey": "TG_CONTROL_TOPIC_ID" }
 *   ]
 * }
 * ```
 */
export interface ITopicsConfigFile {
  /** Schema version */
  schema: string
  /** Array of topic configurations */
  topics: ITopicConfig[]
}

// =============================================================================
// Topic Management
// =============================================================================

/**
 * Basic topic information (lightweight).
 */
export interface ITopicInfo {
  /** Topic ID */
  id: number
  /** Topic name */
  name: string
  /** Topic icon color */
  iconColor?: number
}

/**
 * Existing topic information from Telegram.
 */
export interface IExistingTopic {
  /** Topic thread ID */
  threadId: number
  /** Topic name */
  name: string
  /** Whether topic is closed */
  closed: boolean
  /** Whether topic is hidden */
  hidden: boolean
}
