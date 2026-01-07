import type { BootstrapClient } from '../client.js'
import type {
  BotCreationResult,
  CreateBotOptions,
  BotInfo,
  BotListResult,
  BotInfoResult,
  Message,
} from './types.js'
import { MessageHandler } from './message-handler.js'
import { ButtonHandler } from './button-handler.js'
import {
  extractMessageText,
  isBotNamePrompt,
  isUsernamePrompt,
  parseBotToken,
  parseBotsFromInlineKeyboard,
  parseBotsFromButtons,
  parseBotList,
} from './parsers.js'
import { botFatherLogger, debug } from './logger.js'

export type {
  BotCreationResult,
  CreateBotOptions,
  BotInfo,
  BotListResult,
  BotInfoResult,
}

export class BotFatherManager {
  private botFatherUsername = 'botfather'
  private messageHandler: MessageHandler
  private buttonHandler: ButtonHandler

  constructor(private client: BootstrapClient) {
    this.messageHandler = new MessageHandler(client, this.botFatherUsername)
    this.buttonHandler = new ButtonHandler(client, this.botFatherUsername)
  }

  async createBot(options: CreateBotOptions): Promise<BotCreationResult> {
    try {
      this.messageHandler.setupListener()
      await this.messageHandler.sleep(500)

      await this.messageHandler.sendMessage('/newbot')
      await this.messageHandler.sleep(1000)

      const namePrompt = await this.messageHandler.waitForResponse(10000)
      if (!namePrompt) {
        this.messageHandler.removeListener()
        return { success: false, error: 'No response from BotFather (timeout)' }
      }

      const namePromptText = extractMessageText(namePrompt)

      if (!isBotNamePrompt(namePromptText)) {
        this.messageHandler.removeListener()
        return { success: false, error: `Unexpected response: "${namePromptText}"` }
      }

      await this.messageHandler.sendMessage(options.botName)
      await this.messageHandler.sleep(1000)

      const usernamePrompt = await this.messageHandler.waitForResponse(10000)
      if (!usernamePrompt) {
        this.messageHandler.removeListener()
        return { success: false, error: 'No response after bot name (timeout)' }
      }

      const usernamePromptText = extractMessageText(usernamePrompt)

      if (!isUsernamePrompt(usernamePromptText)) {
        this.messageHandler.removeListener()
        return { success: false, error: `Unexpected response: "${usernamePromptText}"` }
      }

      await this.messageHandler.sendMessage(options.botUsername)
      await this.messageHandler.sleep(1000)

      const tokenMessage = await this.messageHandler.waitForResponse(15000)
      if (!tokenMessage) {
        this.messageHandler.removeListener()
        return { success: false, error: 'No response after username (timeout)' }
      }

      const tokenText = extractMessageText(tokenMessage)
      const result = parseBotToken(tokenText)

      this.messageHandler.removeListener()

      return result
    } catch (error) {
      this.messageHandler.removeListener()
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async listBots(): Promise<BotListResult> {
    debug(botFatherLogger, 'listBots() called')
    try {
      this.messageHandler.setupListener()
      await this.messageHandler.sleep(500)

      debug(botFatherLogger, 'Sending /mybots command')
      await this.messageHandler.sendMessage('/mybots')
      await this.messageHandler.sleep(2000)

      debug(botFatherLogger, 'Waiting for response...')
      const response = await this.messageHandler.waitForResponse(15000)
      if (!response) {
        debug(botFatherLogger, 'No response from BotFather (timeout)')
        this.messageHandler.removeListener()
        return { success: false, error: 'No response from BotFather (timeout)' }
      }

      const responseText = extractMessageText(response)
      debug(botFatherLogger, `Response text: "${responseText.slice(0, 100)}..."`)

      let bots = parseBotsFromInlineKeyboard(response)
      debug(botFatherLogger, `Parsed ${bots.length} bots from inline keyboard`)

      if (bots.length === 0) {
        bots = parseBotList(responseText)
        debug(botFatherLogger, `Parsed ${bots.length} bots from text`)
      }

      this.messageHandler.removeListener()
      debug(botFatherLogger, `listBots() returning ${bots.length} bots`)

      return { success: true, bots }
    } catch (error) {
      debug(botFatherLogger, `listBots() error: ${error}`)
      this.messageHandler.removeListener()
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async getBotInfo(botUsername: string): Promise<BotInfoResult> {
    try {
      const username = botUsername.startsWith('@') ? botUsername.slice(1) : botUsername

      this.messageHandler.setupListener()
      await this.messageHandler.sleep(500)

      await this.messageHandler.sendMessage('/mybots')
      await this.messageHandler.sleep(2000)

      const response = await this.messageHandler.waitForResponse(15000)
      if (!response) {
        this.messageHandler.removeListener()
        return { success: false, error: 'No response from BotFather (timeout)' }
      }

      const responseText = extractMessageText(response)
      const allBots = parseBotList(responseText)

      const bot = allBots.find((b) => b.username === username)

      this.messageHandler.removeListener()

      if (!bot) {
        return { success: false, error: `Bot @${username} not found` }
      }

      return { success: true, bot }
    } catch (error) {
      this.messageHandler.removeListener()
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async checkUsernameAvailable(botUsername: string): Promise<boolean> {
    try {
      const username = botUsername.startsWith('@') ? botUsername.slice(1) : botUsername

      this.messageHandler.setupListener()
      await this.messageHandler.sleep(500)

      await this.messageHandler.sendMessage('/newbot')
      await this.messageHandler.sleep(1000)

      const namePrompt = await this.messageHandler.waitForResponse(10000)
      if (!namePrompt) {
        this.messageHandler.removeListener()
        return false
      }

      await this.messageHandler.sendMessage('Test')
      await this.messageHandler.sleep(1000)

      const usernamePrompt = await this.messageHandler.waitForResponse(10000)
      if (!usernamePrompt) {
        this.messageHandler.removeListener()
        return false
      }

      await this.messageHandler.sendMessage(username)
      await this.messageHandler.sleep(2000)

      const response = await this.messageHandler.waitForResponse(10000)
      if (!response) {
        this.messageHandler.removeListener()
        return false
      }

      const responseText = extractMessageText(response)

      await this.messageHandler.sendMessage('/cancel')
      this.messageHandler.removeListener()

      if (responseText.toLowerCase().includes('already taken') || responseText.toLowerCase().includes('occupied')) {
        return false
      }

      return true
    } catch (error) {
      this.messageHandler.removeListener()
      return false
    }
  }

  async listAllBots(): Promise<BotListResult> {
    debug(botFatherLogger, 'listAllBots() called')
    try {
      this.messageHandler.setupListener()

      const allBots: BotInfo[] = []
      let currentPage = 1
      let hasNextPage = true
      let lastMessageId: number | null = null

      while (hasNextPage) {
        debug(botFatherLogger, `listAllBots() page ${currentPage}`)
        console.log(`  📄 Fetching page ${currentPage}...`)

        if (currentPage === 1) {
          await this.messageHandler.sendMessage('/mybots')
          await this.messageHandler.sleep(2000)
        } else {
          await this.messageHandler.sleep(1000)
        }

        const timeout = currentPage === 1 ? 10000 : 10000
        const response = await this.messageHandler.waitForNewResponse(timeout, lastMessageId)
        if (!response) {
          console.log(`  ⚠️ Timeout waiting for page ${currentPage}`)
          break
        }

        // @ts-ignore
        lastMessageId = response.message?.id || null

        const pageBots = parseBotsFromInlineKeyboard(response)

        const seen = new Set<string>()
        const uniquePageBots = pageBots.filter((bot) => {
          if (seen.has(bot.username)) return false
          seen.add(bot.username)
          return true
        })

        allBots.push(...uniquePageBots)
        console.log(`  📄 Page ${currentPage}: Found ${uniquePageBots.length} bots (total: ${allBots.length})`)

        const nextButtonData = this.buttonHandler.findPaginationButtonData(response, 'Next')

        if (nextButtonData) {
          const clicked = await this.buttonHandler.clickInlineButton(response, nextButtonData)
          if (!clicked) {
            console.log(`  ⚠️ Failed to click Next button`)
            break
          }

          currentPage++
        } else {
          console.log(`  ✓ Reached last page (page ${currentPage})`)
          hasNextPage = false
        }

        if (currentPage > 50) {
          console.log(`  ⚠️ Reached page limit (50)`)
          break
        }
      }

      this.messageHandler.removeListener()

      const globalSeen = new Set<string>()
      const uniqueBots = allBots.filter((bot) => {
        if (globalSeen.has(bot.username)) return false
        globalSeen.add(bot.username)
        return true
      })

      return { success: true, bots: uniqueBots }
    } catch (error) {
      this.messageHandler.removeListener()
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async getBotToken(botUsername: string): Promise<{ success: boolean; token?: string }> {
    try {
      this.messageHandler.setupListener()
      await this.messageHandler.sleep(500)

      await this.messageHandler.sendMessage('/mybots')
      await this.messageHandler.sleep(2000)

      const listResponse = await this.messageHandler.waitForResponse(10000)
      if (!listResponse) {
        this.messageHandler.removeListener()
        return { success: false }
      }

      const buttonData = this.buttonHandler.findBotButtonData(listResponse, botUsername)
      if (!buttonData) {
        this.messageHandler.removeListener()
        return { success: false }
      }

      const clicked = await this.buttonHandler.clickInlineButton(listResponse, buttonData)
      if (!clicked) {
        this.messageHandler.removeListener()
        return { success: false }
      }

      await this.messageHandler.sleep(2000)

      const menuResponse = await this.messageHandler.waitForResponse(10000)
      if (!menuResponse) {
        this.messageHandler.removeListener()
        return { success: false }
      }

      const responseText = extractMessageText(menuResponse)

      const hasMenuOptions = this.buttonHandler.hasMenuOptionsButtons(menuResponse)

      if (hasMenuOptions) {
        const apiTokenButton = this.buttonHandler.findButtonByText(menuResponse, 'API Token')
        if (!apiTokenButton) {
          this.messageHandler.removeListener()
          return { success: false }
        }

        const apiTokenClicked = await this.buttonHandler.clickInlineButton(menuResponse, apiTokenButton)
        if (!apiTokenClicked) {
          this.messageHandler.removeListener()
          return { success: false }
        }

        await this.messageHandler.sleep(2000)

        const tokenResponse = await this.messageHandler.waitForResponse(10000)
        if (!tokenResponse) {
          this.messageHandler.removeListener()
          return { success: false }
        }

        const tokenText = extractMessageText(tokenResponse)

        const tokenMatch = tokenText.match(/(\d+:[A-Za-z0-9_-]{35,})/)
        if (tokenMatch) {
          this.messageHandler.removeListener()
          return { success: true, token: tokenMatch[1] }
        }
      } else {
        const tokenMatch = responseText.match(/(\d+:[A-Za-z0-9_-]{35,})/)
        if (tokenMatch) {
          this.messageHandler.removeListener()
          return { success: true, token: tokenMatch[1] }
        }
      }

      this.messageHandler.removeListener()
      return { success: false }
    } catch (error) {
      this.messageHandler.removeListener()
      return { success: false }
    }
  }

  async getAllBotsWithTokens(): Promise<Array<BotInfo & { token: string }>> {
    debug(botFatherLogger, 'getAllBotsWithTokens() called')
    const botsWithTokens: Array<BotInfo & { token: string }> = []
    let currentPage = 1

    try {
      debug(botFatherLogger, 'Setting up message listener')
      this.messageHandler.setupListener()
      await this.messageHandler.sleep(500)

      let hasNextPage = true
      let currentListResponse: Message | null = null

      while (hasNextPage) {
        debug(botFatherLogger, `Processing page ${currentPage}`)
        console.log(`  📄 Page ${currentPage}...`)

        // Only send /mybots on first page
        if (currentPage === 1) {
          debug(botFatherLogger, 'Sending /mybots command (first page)')
          await this.messageHandler.sendMessage('/mybots')
          await this.messageHandler.sleep(2000)

          debug(botFatherLogger, 'Waiting for bot list response...')
          currentListResponse = await this.messageHandler.waitForResponse(10000)
          if (!currentListResponse) {
            debug(botFatherLogger, 'No response from BotFather (timeout)')
            console.log(`  ✗ Failed to get page ${currentPage} response`)
            break
          }
          debug(botFatherLogger, 'Got bot list response')
        }

        if (!currentListResponse) {
          debug(botFatherLogger, 'currentListResponse is null, breaking')
          break
        }

        const pageBots = parseBotsFromButtons(currentListResponse)
        debug(botFatherLogger, `Parsed ${pageBots.length} bots from buttons: ${pageBots.map(b => b.username).join(', ')}`)

        // Debug: Check pagination state
        const hasPrevButton = this.buttonHandler.findButtonByText(currentListResponse, '«')
        const hasNextButton = this.buttonHandler.findPaginationButtonData(currentListResponse, 'Next')
        // @ts-ignore
        const currentMsgId = currentListResponse.message?.id
        debug(botFatherLogger, `Page state: msgId=${currentMsgId}, hasPrev=${!!hasPrevButton}, hasNext=${!!hasNextButton}`)
        console.log(`  [DEBUG] Page ${currentPage}: msgId=${currentMsgId}, hasPrev=${!!hasPrevButton}, hasNext=${!!hasNextButton}, bots=[${pageBots.map(b => b.username).join(', ')}]`)

        const seenUsernames = new Set(botsWithTokens.map((b) => b.username))
        const uniquePageBots = pageBots.filter((bot) => !seenUsernames.has(bot.username))

        console.log(`  📄 Page ${currentPage}: Found ${uniquePageBots.length} unique bot(s) to process`)

        // Process each bot on this page using Back navigation
        for (let i = 0; i < uniquePageBots.length; i++) {
          const bot = uniquePageBots[i]
          if (!bot) continue

          console.log(`    ⏳ [${i + 1}/${uniquePageBots.length}] Fetching token for @${bot.username}...`)

          this.messageHandler.clearBuffer()

          // Find and click the bot button from the current list
          const buttonData = this.buttonHandler.findBotButtonData(currentListResponse, bot.username)
          if (!buttonData) {
            console.log(`    ✗ Bot @${bot.username} not found in list`)
            continue
          }

          // Click bot button to go to bot menu
          const clicked = await this.buttonHandler.clickInlineButton(currentListResponse, buttonData)
          if (!clicked) {
            console.log(`    ✗ Failed to click @${bot.username}`)
            continue
          }

          await this.messageHandler.sleep(2000)

          // Wait for menu response (bot options)
          const menuResponse = await this.messageHandler.waitForResponse(10000)
          if (!menuResponse) {
            console.log(`    ✗ No menu response for @${bot.username}`)
            continue
          }

          const menuText = extractMessageText(menuResponse)
          const hasMenuOptions = this.buttonHandler.hasMenuOptionsButtons(menuResponse)

          let token: string | undefined
          let lastResponseBeforeBack: Message = menuResponse

          if (hasMenuOptions) {
            // Click "API Token" button
            const apiTokenButton = this.buttonHandler.findButtonByText(menuResponse, 'API Token')
            if (!apiTokenButton) {
              console.log(`    ✗ No API Token button for @${bot.username}`)
              // Navigate back to list
              await this.buttonHandler.clickBackToBotList(menuResponse)
              await this.messageHandler.sleep(1500)
              currentListResponse = await this.messageHandler.waitForResponse(10000)
              continue
            }

            const apiTokenClicked = await this.buttonHandler.clickInlineButton(menuResponse, apiTokenButton)
            if (!apiTokenClicked) {
              console.log(`    ✗ Failed to click API Token for @${bot.username}`)
              await this.buttonHandler.clickBackToBotList(menuResponse)
              await this.messageHandler.sleep(1500)
              currentListResponse = await this.messageHandler.waitForResponse(10000)
              continue
            }

            await this.messageHandler.sleep(2000)

            // Wait for token response
            const tokenResponse = await this.messageHandler.waitForResponse(10000)
            if (!tokenResponse) {
              console.log(`    ✗ No token response for @${bot.username}`)
              continue
            }

            const tokenText = extractMessageText(tokenResponse)
            lastResponseBeforeBack = tokenResponse

            const tokenMatch = tokenText.match(/(\d+:[A-Za-z0-9_-]{35,})/)
            if (tokenMatch) {
              token = tokenMatch[1]
            }
          } else {
            // Token is directly in the response
            const tokenMatch = menuText.match(/(\d+:[A-Za-z0-9_-]{35,})/)
            if (tokenMatch) {
              token = tokenMatch[1]
            }
          }

          if (token) {
            botsWithTokens.push({
              username: bot.username,
              name: bot.name || bot.username,
              token,
              description: bot.description,
              about: bot.about,
            })
            console.log(`    ✓ [@${bot.username}] Got token`)
          } else {
            console.log(`    ✗ [@${bot.username}] Failed to get token`)
          }

          // Navigate back to bot list using Back buttons
          // First: "Back to Bot" (from token view to bot menu)
          debug(botFatherLogger, 'Navigating back: clicking "Back to Bot"')
          const backToBotClicked = await this.buttonHandler.clickBackToBot(lastResponseBeforeBack)
          if (backToBotClicked) {
            debug(botFatherLogger, '"Back to Bot" clicked, waiting for bot menu...')
            await this.messageHandler.sleep(1500)
            const botMenuResponse = await this.messageHandler.waitForResponse(10000)
            if (botMenuResponse) {
              debug(botFatherLogger, 'Got bot menu, clicking "Back to Bot List"')
              // Second: "Back to Bot List" (from bot menu to list)
              await this.buttonHandler.clickBackToBotList(botMenuResponse)
              await this.messageHandler.sleep(1500)
              currentListResponse = await this.messageHandler.waitForResponse(10000)
            }
          } else {
            debug(botFatherLogger, '"Back to Bot" not found, trying direct "Back to Bot List"')
            // Fallback: try direct "Back to Bot List" if available
            const backToListClicked = await this.buttonHandler.clickBackToBotList(lastResponseBeforeBack)
            if (backToListClicked) {
              await this.messageHandler.sleep(1500)
              currentListResponse = await this.messageHandler.waitForResponse(10000)
            }
          }

          // BotFather's "Back to Bot List" always returns to page 1
          // If we're on a page > 1, we need to navigate forward to the correct page
          const botsAfterBack = currentListResponse ? parseBotsFromButtons(currentListResponse) : []
          const hasPrevAfterBack = currentListResponse ? this.buttonHandler.findPreviousButtonData(currentListResponse) : null
          console.log(`    [DEBUG] After Back: currentPage=${currentPage}, bots=${botsAfterBack.length}, hasPrev=${!!hasPrevAfterBack}`)

          if (currentListResponse && currentPage > 1) {
            debug(botFatherLogger, `After Back: page=${currentPage}, hasPrev=${!!hasPrevAfterBack}, botsVisible=${botsAfterBack.length}`)

            if (!hasPrevAfterBack) {
              // We're on page 1 but should be on a different page - navigate forward
              debug(botFatherLogger, `Back returned to page 1, navigating forward to page ${currentPage}`)
              console.log(`    [DEBUG] Navigating forward: page 1 -> page ${currentPage}`)

              for (let navPage = 1; navPage < currentPage; navPage++) {
                const nextBtn = this.buttonHandler.findPaginationButtonData(currentListResponse, 'Next')
                if (!nextBtn) {
                  debug(botFatherLogger, `Cannot find Next button at page ${navPage}`)
                  console.log(`    [DEBUG] Cannot find Next button at page ${navPage}`)
                  break
                }
                debug(botFatherLogger, `Clicking Next to go from page ${navPage} to ${navPage + 1}`)
                console.log(`    [DEBUG] Clicking Next: page ${navPage} -> ${navPage + 1}`)
                await this.buttonHandler.clickInlineButton(currentListResponse, nextBtn)
                await this.messageHandler.sleep(1500)
                currentListResponse = await this.messageHandler.waitForResponse(10000)
                if (!currentListResponse) {
                  debug(botFatherLogger, `No response after Next click at page ${navPage}`)
                  break
                }
              }

              const finalBots = currentListResponse ? parseBotsFromButtons(currentListResponse) : []
              debug(botFatherLogger, `Navigation complete: now on page ${currentPage} with ${finalBots.length} bots`)
              console.log(`    [DEBUG] Navigation complete: ${finalBots.length} bots visible`)
            } else {
              debug(botFatherLogger, `Already on page ${currentPage} (hasPrev=true)`)
            }
          }

          // Small delay between bots
          if (i < uniquePageBots.length - 1) {
            await this.messageHandler.sleep(500)
          }
        }

        // Check if there's a next page (from the current list response)
        if (currentListResponse) {
          const nextButtonData = this.buttonHandler.findPaginationButtonData(currentListResponse, 'Next')
          if (nextButtonData) {
            console.log(`  ➡️ Moving to next page...`)
            const clicked = await this.buttonHandler.clickInlineButton(currentListResponse, nextButtonData)
            if (!clicked) {
              console.log(`  ⚠️ Failed to click Next button`)
              break
            }
            currentPage++
            await this.messageHandler.sleep(1500)
            currentListResponse = await this.messageHandler.waitForResponse(10000)
          } else {
            console.log(`  ✓ Reached last page (page ${currentPage})`)
            hasNextPage = false
          }
        } else {
          hasNextPage = false
        }
      }

      this.messageHandler.removeListener()

      console.log(`  ✓ Successfully fetched ${botsWithTokens.length} bot tokens across ${currentPage} page(s)`)
    } catch (error) {
      console.log(`  ✗ Error in getAllBotsWithTokens:`, error)
      this.messageHandler.removeListener()
    }

    return botsWithTokens
  }
}
