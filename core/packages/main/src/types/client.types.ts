/**
 * Telegram client types.
 *
 * Types for the GramJS client wrapper used for MTProto operations.
 *
 * @module
 */

// =============================================================================
// Client Configuration
// =============================================================================

/**
 * Configuration for creating a Telegram client.
 *
 * @example
 * ```typescript
 * const config: ITelegramClientConfig = {
 *   apiId: 12345,
 *   apiHash: 'your_api_hash',
 *   sessionPath: '/path/to/session.txt'
 * };
 * ```
 *
 * @see {@link https://my.telegram.org | Get API credentials}
 */
export interface ITelegramClientConfig {
  /** Telegram API ID from https://my.telegram.org */
  apiId: number
  /** Telegram API Hash from https://my.telegram.org */
  apiHash: string
  /** Optional path to store session file (default: ~/.mks-telegram-bot/session.txt) */
  sessionPath?: string
}

/**
 * Stored session data for persistence.
 *
 * @example
 * ```typescript
 * const session: ISessionData = {
 *   apiId: 12345,
 *   apiHash: 'abc123',
 *   sessionString: 'base64_encoded_session...'
 * };
 * ```
 */
export interface ISessionData {
  /** Telegram API ID */
  apiId: number
  /** Telegram API Hash */
  apiHash: string
  /** GramJS StringSession encoded as string */
  sessionString: string
}

// =============================================================================
// Connection Options
// =============================================================================

/**
 * Options for connecting to Telegram.
 */
export interface IConnectOptions {
  /** Mute GramJS internal logs during connection */
  muteLogs?: boolean
}

/**
 * Options for authorization flow.
 */
export interface IAuthOptions {
  /** Mute GramJS internal logs during auth */
  muteLogs?: boolean
}

// =============================================================================
// User Information
// =============================================================================

/**
 * Current authenticated user information.
 *
 * @example
 * ```typescript
 * const me = await client.getMe();
 * if (me) {
 *   console.log(`Logged in as @${me.username}`);
 * }
 * ```
 */
export interface ICurrentUser {
  /** Telegram user ID */
  id: number
  /** Username (without @) */
  username?: string
  /** First name */
  firstName: string
}

// =============================================================================
// Dialog Types
// =============================================================================

/**
 * A dialog (chat) from the user's chat list.
 */
export interface IDialog {
  /** Chat/User ID */
  id: number
  /** Display name (user's name or chat title) */
  name: string
  /** Username if available */
  username?: string
}
