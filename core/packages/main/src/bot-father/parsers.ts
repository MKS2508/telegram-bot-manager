import type { Message, BotInfo, BotCreationResult } from './types.js'

export function extractMessageText(message: Message): string {
  try {
    // @ts-ignore - accessing GramJS internal structure
    const msg = message.message

    // @ts-ignore
    if (msg?.message) {
      // @ts-ignore
      return String(msg.message)
    }

    // @ts-ignore
    if (msg?.text) {
      // @ts-ignore
      const text = msg.text
      if (Array.isArray(text)) {
        // @ts-ignore
        return text.map((t: any) => t.text || t).join('')
      }
      return String(text)
    }

    if ('text' in message && message.text) {
      const text = message.text
      if (Array.isArray(text)) {
        // @ts-ignore
        return text.map((t: any) => t.text || t).join('')
      }
      return String(text)
    }

    return ''
  } catch (error) {
    return ''
  }
}

export function isBotNamePrompt(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes('choose') ||
    lower.includes('name') ||
    lower.includes('title') ||
    lower.includes('Alright') ||
    (lower.includes('please') && lower.includes('name'))
  )
}

export function isUsernamePrompt(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    (lower.includes('username') || lower.includes('user name')) &&
    (lower.includes('bot') || lower.includes('must end'))
  )
}

export function parseBotToken(text: string): BotCreationResult {
  const tokenPatterns = [
    /(\d{7,10}:[A-Za-z0-9_-]{35})/,
    /(\d{7,10}:[A-Za-z0-9_-]{32,})/,
    /(\d{6,10}:[A-Za-z0-9_-]{30,})/,
  ]

  let token: string | undefined
  for (const pattern of tokenPatterns) {
    const match = text.match(pattern)
    if (match) {
      token = match[1]
      break
    }
  }

  if (!token) {
    if (text.toLowerCase().includes('already taken')) {
      return { success: false, error: 'Username already taken' }
    }
    if (text.toLowerCase().includes('invalid')) {
      return { success: false, error: 'Invalid username format' }
    }
    return { success: false, error: `Could not parse bot token from: "${text.slice(0, 100)}"` }
  }

  const usernamePatterns = [
    /t\.me\/([A-Za-z0-9_]{5,32}bot)/i,
    /@([A-Za-z0-9_]{5,32}bot)/i,
    /username[^\w]*([A-Za-z0-9_]{5,32}bot)/i,
  ]

  let username: string | undefined
  for (const pattern of usernamePatterns) {
    const match = text.match(pattern)
    if (match) {
      username = match[1]
      break
    }
  }

  return {
    success: true,
    botToken: token,
    botUsername: username,
  }
}

export function parseBotsFromInlineKeyboard(message: Message): BotInfo[] {
  const bots: BotInfo[] = []

  try {
    // @ts-ignore
    const msg = message.message

    // @ts-ignore
    if (!msg?.replyMarkup?.rows) {
      return bots
    }

    // @ts-ignore
    const rows = msg.replyMarkup.rows

    for (const row of rows) {
      // @ts-ignore
      if (!row.buttons) continue

      // @ts-ignore
      for (const button of row.buttons) {
        // @ts-ignore
        const buttonText = button.text

        const usernameMatch = buttonText.match(/\(([A-Za-z0-9_]+bot)\)/) || buttonText.match(/@([A-Za-z0-9_]+bot)/)

        if (usernameMatch) {
          const username = usernameMatch[1]
          const name = buttonText
            .replace(/\s*\([A-Za-z0-9_]+bot\)/, '')
            .replace(/@[A-Za-z0-9_]+bot/, '')
            .trim()

          bots.push({ username, name: name || username })
        } else if (buttonText.endsWith('bot')) {
          bots.push({ username: buttonText, name: buttonText })
        }
      }
    }
  } catch (error) {
    // Silently ignore parsing errors
  }

  return bots
}

export function parseBotsFromButtons(message: Message): BotInfo[] {
  const bots: BotInfo[] = []

  try {
    // @ts-ignore
    const msg = message.message
    if (!msg?.replyMarkup?.rows) return []

    for (const row of msg.replyMarkup.rows) {
      // @ts-ignore
      if (!row.buttons) continue

      // @ts-ignore
      for (const button of row.buttons) {
        // @ts-ignore
        const buttonText = button.text

        // Skip pagination and menu buttons
        if (buttonText === 'Next' || buttonText === 'Previous' ||
            buttonText === 'API Token' || buttonText === 'Edit Bot' ||
            buttonText === 'Bot Settings' || buttonText === 'Transfer Ownership' ||
            buttonText === 'Payments' || buttonText === 'Delete Bot' ||
            buttonText === '« Back to Bot List' || buttonText === '« Back to Bot') {
          continue
        }

        const match = buttonText.match(/^(.+?)\s+\(([A-Za-z0-9_]+bot)\)$|^@([A-Za-z0-9_]+bot)$/)
        if (match) {
          let name: string
          let username: string

          if (match[1] && match[2]) {
            name = match[1].trim()
            username = match[2].trim()
          } else if (match[3]) {
            username = match[3].trim()
            name = username
          } else {
            continue
          }

          bots.push({ username, name })
        }
      }
    }
  } catch (error) {
    // Silently ignore errors
  }

  return bots
}

export function parseBotList(responseText: string): BotInfo[] {
  const bots: BotInfo[] = []

  const patterns = [
    /(?:\d+\.\s*)?(\S+)\s+\(([A-Za-z0-9_]+bot)\)/g,
    /@([A-Za-z0-9_]+bot)\s*-\s*([^\n]+)/g,
  ]

  for (const pattern of patterns) {
    let match
    // biome-ignore lint/suspicious/noAssignInExpressions: Required for regex exec loop
    while ((match = pattern.exec(responseText)) !== null) {
      if (pattern === patterns[0]) {
        const name = match[1]?.trim()
        const username = match[2]?.trim()
        if (name && username) {
          bots.push({ username, name })
        }
      } else {
        const username = match[1]?.trim()
        const name = match[2]?.trim()
        if (username && name) {
          bots.push({ username, name })
        }
      }
    }
  }

  const seen = new Set<string>()
  return bots.filter((bot) => {
    if (seen.has(bot.username)) {
      return false
    }
    seen.add(bot.username)
    return true
  })
}
