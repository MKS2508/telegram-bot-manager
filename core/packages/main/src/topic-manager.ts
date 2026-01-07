import { Telegram } from 'telegraf'

/**
 * Result of topic creation
 */
export interface TopicCreationResult {
  success: boolean
  threadId?: number
  error?: string
}

/**
 * Options for creating a topic
 */
export interface CreateTopicOptions {
  chatId: number
  name: string
  iconColor?: number
  iconEmoji?: string
}

/**
 * Topic manager for creating forum topics
 * Uses Telegram Bot API
 */
export class TopicManager {
  constructor(private botToken: string) {}

  /**
   * Create a forum topic
   * @param options Topic creation options
   */
  async createTopic(options: CreateTopicOptions): Promise<TopicCreationResult> {
    const telegram = new Telegram(this.botToken)

    try {
      // @ts-ignore - createForumTopic exists but types might be incomplete
      const result = await telegram.createForumTopic(options.chatId, options.name, {
        // @ts-ignore
        icon_color: options.iconColor,
        // @ts-ignore
        icon_emoji: options.iconEmoji,
      })

      if (result && result.message_thread_id) {
        return {
          success: true,
          threadId: result.message_thread_id,
        }
      }

      return {
        success: false,
        error: 'No thread ID returned',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Create multiple topics at once
   * @param chatId The chat ID
   * @param topicNames Array of topic names
   */
  async createTopics(
    chatId: number,
    topicNames: string[]
  ): Promise<Array<{ name: string; result: TopicCreationResult }>> {
    const results: Array<{ name: string; result: TopicCreationResult }> = []

    for (const topicName of topicNames) {
      const result = await this.createTopic({
        chatId,
        name: topicName,
        iconColor: this.getRandomColor(),
      })

      results.push({ name: topicName, result })

      // Small delay to avoid rate limiting
      await this.sleep(500)
    }

    return results
  }

  /**
   * Get all topics in a forum
   * @param chatId The chat ID
   */
  async getForumTopics(chatId: number): Promise<
    Array<{ threadId: number; name: string; iconColor?: number }>
  > {
    const telegram = new Telegram(this.botToken)

    try {
      // Using the raw API call since method might not be in types
      // @ts-ignore
      const result = await telegram.callApi('getForumTopics', {
        chat_id: chatId,
      })

      // @ts-ignore - result structure varies
      if (result && result.topics) {
        // @ts-ignore
        return result.topics.map((topic: any) => ({
          threadId: topic.message_thread_id,
          name: topic.name,
          iconColor: topic.icon_color,
        }))
      }

      return []
    } catch {
      return []
    }
  }

  /**
   * Get a random color for topic icon
   * These are the predefined color values from Telegram
   */
  private getRandomColor(): number {
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
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
