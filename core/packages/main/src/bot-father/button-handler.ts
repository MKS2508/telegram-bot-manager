import type { BootstrapClient } from '../client.js'
import type { Message } from './types.js'
import { buttonLogger, debug } from './logger.js'

export class ButtonHandler {
  constructor(
    private client: BootstrapClient,
    private botFatherUsername: string
  ) {}

  hasPaginationButton(message: Message, buttonText: string): boolean {
    return this.findPaginationButtonData(message, buttonText) !== null
  }

  findPaginationButtonData(message: Message, buttonText: string): string | null {
    try {
      // @ts-ignore
      const msg = message.message
      if (!msg?.replyMarkup?.rows) {
        debug(buttonLogger, `No replyMarkup in message for pagination "${buttonText}"`)
        return null
      }

      const paginationPatterns = [
        buttonText,
        '▶',
        '→',
        '›',
        '»',
        'Next page',
        'Page',
        '››',
        '>',
      ]

      for (const row of msg.replyMarkup.rows) {
        // @ts-ignore
        if (!row.buttons) continue

        // @ts-ignore
        for (const button of row.buttons) {
          // @ts-ignore
          const buttonLabel = button.text

          for (const pattern of paginationPatterns) {
            if (buttonLabel === pattern || buttonLabel.includes(pattern)) {
              debug(buttonLogger, `Found pagination button "${buttonLabel}" (pattern: ${pattern})`)
              // @ts-ignore
              return button.data
            }
          }
        }
      }
      debug(buttonLogger, `Pagination button "${buttonText}" not found`)
    } catch (error) {
      debug(buttonLogger, `Error finding pagination button: ${error}`)
    }
    return null
  }

  findPreviousButtonData(message: Message): string | null {
    try {
      // @ts-ignore
      const msg = message.message
      if (!msg?.replyMarkup?.rows) {
        debug(buttonLogger, 'No replyMarkup in message for previous button')
        return null
      }

      const prevPatterns = ['«', '‹', '◀', '←', '<', '‹‹', 'Previous', 'Prev']

      for (const row of msg.replyMarkup.rows) {
        // @ts-ignore
        if (!row.buttons) continue

        // @ts-ignore
        for (const button of row.buttons) {
          // @ts-ignore
          const buttonLabel = button.text

          for (const pattern of prevPatterns) {
            if (buttonLabel === pattern || buttonLabel.includes(pattern)) {
              debug(buttonLogger, `Found previous button "${buttonLabel}" (pattern: ${pattern})`)
              // @ts-ignore
              return button.data
            }
          }
        }
      }
      debug(buttonLogger, 'Previous button not found')
    } catch (error) {
      debug(buttonLogger, `Error finding previous button: ${error}`)
    }
    return null
  }

  async clickInlineButton(message: Message, buttonData: string): Promise<boolean> {
    try {
      // @ts-ignore
      const msg = message.message
      if (!msg?.id) {
        debug(buttonLogger, 'No message id for button click')
        return false
      }

      debug(buttonLogger, `Clicking button (msgId=${msg.id}, data="${buttonData.slice(0, 20)}...")`)

      const tgClient = this.client.getClient()
      const botFatherPeer = await tgClient.getEntity(this.botFatherUsername)
      const dataBuffer = Buffer.from(buttonData, 'utf-8')

      const { Api } = await import('telegram/tl/index.js')

      // @ts-ignore
      const result = await tgClient.invoke(new Api.messages.GetBotCallbackAnswer({
        peer: botFatherPeer,
        msgId: msg.id,
        data: dataBuffer,
      }))

      debug(buttonLogger, `Button clicked successfully`)
      return true
    } catch (error) {
      debug(buttonLogger, `Button click failed: ${error}`)
      return false
    }
  }

  findBotButtonData(message: Message, botUsername: string): string | null {
    const cleanUsername = botUsername.startsWith('@') ? botUsername.slice(1) : botUsername
    debug(buttonLogger, `Finding bot button for @${cleanUsername}`)

    try {
      // @ts-ignore
      const msg = message.message
      if (!msg?.replyMarkup?.rows) {
        debug(buttonLogger, 'No replyMarkup in message')
        return null
      }

      const allButtons: string[] = []
      for (const row of msg.replyMarkup.rows) {
        // @ts-ignore
        if (!row.buttons) continue

        // @ts-ignore
        for (const button of row.buttons) {
          // @ts-ignore
          const buttonText = button.text
          allButtons.push(buttonText)

          if (buttonText.includes(cleanUsername) || buttonText.includes(`@${cleanUsername}`)) {
            debug(buttonLogger, `Found bot button: "${buttonText}"`)
            // @ts-ignore
            return button.data
          }
        }
      }
      debug(buttonLogger, `Bot @${cleanUsername} not found. Available buttons: ${allButtons.join(', ')}`)
    } catch (error) {
      debug(buttonLogger, `Error finding bot button: ${error}`)
    }
    return null
  }

  hasMenuOptionsButtons(message: Message): boolean {
    try {
      // @ts-ignore
      const msg = message.message
      if (!msg?.replyMarkup?.rows) return false

      for (const row of msg.replyMarkup.rows) {
        // @ts-ignore
        if (!row.buttons) continue

        // @ts-ignore
        for (const button of row.buttons) {
          // @ts-ignore
          const buttonText = button.text

          if (buttonText === 'API Token' || buttonText === 'Edit Bot' ||
              buttonText === 'Bot Settings' || buttonText === 'Transfer Ownership' ||
              buttonText === 'Payments' || buttonText === 'Delete Bot' ||
              buttonText === '« Back to Bot List') {
            debug(buttonLogger, `Has menu options (found: "${buttonText}")`)
            return true
          }
        }
      }
    } catch (error) {
      debug(buttonLogger, `Error checking menu options: ${error}`)
    }
    return false
  }

  findButtonByText(message: Message, buttonText: string): string | null {
    debug(buttonLogger, `Finding button by text: "${buttonText}"`)
    try {
      // @ts-ignore
      const msg = message.message
      if (!msg?.replyMarkup?.rows) {
        debug(buttonLogger, 'No replyMarkup in message')
        return null
      }

      for (const row of msg.replyMarkup.rows) {
        // @ts-ignore
        if (!row.buttons) continue

        // @ts-ignore
        for (const button of row.buttons) {
          // @ts-ignore
          if (button.text === buttonText) {
            debug(buttonLogger, `Found button "${buttonText}"`)
            // @ts-ignore
            return button.data
          }
        }
      }
      debug(buttonLogger, `Button "${buttonText}" not found`)
    } catch (error) {
      debug(buttonLogger, `Error finding button: ${error}`)
    }
    return null
  }

  async clickBackToBot(message: Message): Promise<boolean> {
    debug(buttonLogger, 'Clicking "Back to Bot" button')
    const buttonData = this.findButtonByText(message, '« Back to Bot')
    if (!buttonData) {
      debug(buttonLogger, '"Back to Bot" button not found')
      return false
    }
    return this.clickInlineButton(message, buttonData)
  }

  async clickBackToBotList(message: Message): Promise<boolean> {
    debug(buttonLogger, 'Clicking "Back to Bot List" button')
    const buttonData = this.findButtonByText(message, '« Back to Bot List')
    if (!buttonData) {
      debug(buttonLogger, '"Back to Bot List" button not found')
      return false
    }
    return this.clickInlineButton(message, buttonData)
  }
}
