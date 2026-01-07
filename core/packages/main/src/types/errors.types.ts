/**
 * Error types and codes.
 *
 * Domain-specific error codes for the telegram-bot-manager library.
 *
 * @module
 */

// =============================================================================
// Error Codes
// =============================================================================

/**
 * Error codes for telegram-bot-manager operations.
 *
 * @example
 * ```typescript
 * import { TelegramErrorCode } from '@mks2508/telegram-bot-manager';
 *
 * if (error.code === TelegramErrorCode.BotFatherTimeout) {
 *   console.log('BotFather did not respond in time');
 * }
 * ```
 */
export const TelegramErrorCode = {
  // Connection errors
  /** Failed to connect to Telegram */
  ConnectionFailed: 'TELEGRAM_CONNECTION_FAILED',
  /** Connection timeout */
  ConnectionTimeout: 'TELEGRAM_CONNECTION_TIMEOUT',
  /** Not authorized (need to login) */
  NotAuthorized: 'TELEGRAM_NOT_AUTHORIZED',
  /** Session expired */
  SessionExpired: 'TELEGRAM_SESSION_EXPIRED',

  // BotFather errors
  /** BotFather did not respond */
  BotFatherTimeout: 'BOTFATHER_TIMEOUT',
  /** BotFather returned unexpected response */
  BotFatherUnexpectedResponse: 'BOTFATHER_UNEXPECTED_RESPONSE',
  /** Bot username already taken */
  BotUsernameUnavailable: 'BOTFATHER_USERNAME_UNAVAILABLE',
  /** Invalid bot username format */
  BotUsernameInvalid: 'BOTFATHER_USERNAME_INVALID',
  /** Bot not found */
  BotNotFound: 'BOTFATHER_BOT_NOT_FOUND',
  /** Failed to create bot */
  BotCreationFailed: 'BOTFATHER_CREATION_FAILED',

  // Group errors
  /** Failed to create group */
  GroupCreationFailed: 'GROUP_CREATION_FAILED',
  /** Group not found */
  GroupNotFound: 'GROUP_NOT_FOUND',
  /** Not admin in group */
  GroupNotAdmin: 'GROUP_NOT_ADMIN',
  /** Failed to add bot to group */
  GroupAddBotFailed: 'GROUP_ADD_BOT_FAILED',

  // Topic errors
  /** Failed to create topic */
  TopicCreationFailed: 'TOPIC_CREATION_FAILED',
  /** Topic not found */
  TopicNotFound: 'TOPIC_NOT_FOUND',
  /** Cannot delete default General topic */
  TopicCannotDeleteDefault: 'TOPIC_CANNOT_DELETE_DEFAULT',

  // Env errors
  /** Bot configuration not found */
  EnvBotNotFound: 'ENV_BOT_NOT_FOUND',
  /** Environment file not found */
  EnvFileNotFound: 'ENV_FILE_NOT_FOUND',
  /** Failed to read env file */
  EnvReadFailed: 'ENV_READ_FAILED',
  /** Failed to write env file */
  EnvWriteFailed: 'ENV_WRITE_FAILED',

  // Config errors
  /** Config file not found */
  ConfigNotFound: 'CONFIG_NOT_FOUND',
  /** Invalid config format */
  ConfigInvalid: 'CONFIG_INVALID',

  // General errors
  /** Operation cancelled by user */
  Cancelled: 'OPERATION_CANCELLED',
  /** Validation failed */
  ValidationFailed: 'VALIDATION_FAILED',
  /** Unknown error */
  Unknown: 'UNKNOWN_ERROR',
} as const

export type TelegramErrorCode = (typeof TelegramErrorCode)[keyof typeof TelegramErrorCode]
