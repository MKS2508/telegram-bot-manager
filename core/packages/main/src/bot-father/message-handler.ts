import type { BootstrapClient } from '../client.js'
import type { Message } from './types.js'
import { NewMessage } from 'telegram/events'
import { EditedMessage } from 'telegram/events/EditedMessage'
import { messageLogger, debug } from './logger.js'

export class MessageHandler {
  private lastMessage: Message | null = null
  private messageHandlerRef: any = null
  private resolveResponse: ((message: Message) => void) | null = null
  private messageHandler: ((message: Message) => void) | null = null
  private messageBuffer: Message[] = []
  private isListening = false

  constructor(
    private client: BootstrapClient,
    private botFatherUsername: string
  ) {}

  async sendMessage(text: string): Promise<void> {
    debug(messageLogger, `Sending message to BotFather: "${text}"`)
    await this.client.sendMessageToUser(this.botFatherUsername, text)
    debug(messageLogger, `Message sent: "${text}"`)
  }

  setupListener(): void {
    if (this.isListening) {
      debug(messageLogger, 'Listener already active, skipping setup')
      return
    }

    debug(messageLogger, 'Setting up message listener for BotFather')
    const client = this.client.getClient()

    this.messageHandler = (event: Message) => {
      // @ts-ignore
      const msgId = event.message?.id
      // @ts-ignore
      const msgText = event.message?.message?.slice(0, 50) || '[no text]'
      debug(messageLogger, `Received message id=${msgId}: "${msgText}..."`)

      this.messageBuffer.push(event)
      this.lastMessage = event

      if (this.resolveResponse) {
        debug(messageLogger, `Resolving pending promise with message id=${msgId}`)
        const resolve = this.resolveResponse
        this.resolveResponse = null
        resolve(event)
      }
    }

    const newMessageEvent = new NewMessage({
      fromUsers: [this.botFatherUsername],
    })
    client.addEventHandler(this.messageHandler, newMessageEvent)

    const editedMessageEvent = new EditedMessage({
      fromUsers: [this.botFatherUsername],
    })
    client.addEventHandler(this.messageHandler, editedMessageEvent)

    this.messageHandlerRef = true
    this.isListening = true
    debug(messageLogger, 'Message listener setup complete')
  }

  removeListener(): void {
    debug(messageLogger, 'Removing message listener')
    if (this.messageHandlerRef && this.messageHandler) {
      const client = this.client.getClient()

      const newMessageEvent = new NewMessage({
        fromUsers: [this.botFatherUsername],
      })
      const editedMessageEvent = new EditedMessage({
        fromUsers: [this.botFatherUsername],
      })

      client.removeEventHandler(this.messageHandler, newMessageEvent)
      client.removeEventHandler(this.messageHandler, editedMessageEvent)

      this.messageHandlerRef = null
    }

    this.messageHandler = null
    this.lastMessage = null
    this.resolveResponse = null
    this.messageBuffer = []
    this.isListening = false
    debug(messageLogger, 'Message listener removed')
  }

  clearBuffer(): void {
    debug(messageLogger, `Clearing buffer (had ${this.messageBuffer.length} messages)`)
    this.messageBuffer = []
    this.resolveResponse = null
  }

  waitForResponse(timeout: number): Promise<Message | null> {
    return this.waitForNewResponse(timeout, null)
  }

  waitForNewResponse(timeout: number, lastMessageId: number | null): Promise<Message | null> {
    debug(messageLogger, `Waiting for response (timeout=${timeout}ms, lastMsgId=${lastMessageId})`)

    return new Promise((resolve) => {
      if (this.messageBuffer.length > 0) {
        debug(messageLogger, `Buffer has ${this.messageBuffer.length} messages, checking...`)
        let message: Message | null = null
        while (this.messageBuffer.length > 0) {
          const msg = this.messageBuffer.shift()!
          // @ts-ignore
          const msgId = msg.message?.id

          if (lastMessageId && msgId && msgId < lastMessageId) {
            debug(messageLogger, `Skipping old message id=${msgId} (< ${lastMessageId})`)
            continue
          }

          message = msg
          break
        }

        if (message) {
          // @ts-ignore
          const msgId = message.message?.id
          debug(messageLogger, `Found message in buffer id=${msgId}`)
          // @ts-ignore
          resolve(message)
          return
        }
      }

      debug(messageLogger, 'No message in buffer, waiting for new message...')
      this.resolveResponse = (msg: Message) => {
        // @ts-ignore
        const msgId = msg.message?.id

        if (lastMessageId && msgId && msgId < lastMessageId) {
          debug(messageLogger, `Ignoring old message id=${msgId}`)
          return
        }

        debug(messageLogger, `Received new message id=${msgId}`)
        // @ts-ignore
        resolve(msg)
      }

      if (!this.messageHandlerRef) {
        debug(messageLogger, 'No listener active, setting up...')
        this.setupListener()
      }

      setTimeout(() => {
        if (this.resolveResponse) {
          debug(messageLogger, `Timeout reached (${timeout}ms), resolving with null`)
          this.resolveResponse = null
          resolve(null)
        }
      }, timeout)
    })
  }

  sleep(ms: number): Promise<void> {
    debug(messageLogger, `Sleeping for ${ms}ms`)
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
