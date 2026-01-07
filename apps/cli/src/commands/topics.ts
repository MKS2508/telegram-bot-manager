/**
 * Topics management CLI command.
 *
 * Create and manage forum topics in Telegram groups.
 *
 * @module
 */

import type { Command } from 'commander'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { input, confirm, checkbox } from '@inquirer/prompts'
import { Telegram } from 'telegraf'
import ora from 'ora'
import { EnvManager } from 'mks2508/main'
import {
  cliLogger,
  printTitle,
  sleep,
  getEnvKeyForTopic,
  getRandomTopicColor,
  updateEnvVar,
} from '../utils/index.js'

/**
 * Topics command options.
 */
interface ITopicsOptions {
  chatId?: string
  topics?: string
  environment?: 'local' | 'staging' | 'production'
}

/**
 * Register the topics command.
 *
 * @param program - Commander program instance
 */
export function registerTopicsCommand(program: Command): void {
  program
    .command('topics')
    .description('Create forum topics in a Telegram group')
    .option('-c, --chat-id <value>', 'Chat ID of the group (must be a supergroup/forum)')
    .option('-t, --topics <list>', 'Comma-separated list of topic names')
    .option('-e, --environment <env>', 'Target environment', 'local')
    .action(handleCreateTopics)
}

/**
 * Handle topics creation.
 */
async function handleCreateTopics(options: ITopicsOptions): Promise<void> {
  printTitle('🧵 Create Forum Topics')

  const environment = options.environment ?? 'local'
  const envManager = new EnvManager()
  const activeBot = envManager.getActiveBot()

  let botToken: string | undefined

  if (activeBot) {
    try {
      const config = await envManager.readEnv(activeBot, environment as 'local' | 'staging' | 'production')
      botToken = config.botToken
    } catch {
      cliLogger.warn(`Could not load config for @${activeBot}`)
    }
  }

  if (!botToken) {
    const envFile = resolve(process.cwd(), 'core', `.env.${environment}`)

    if (!existsSync(envFile)) {
      cliLogger.error(`Environment file not found: ${envFile}`)
      cliLogger.info('Please run "tbm bootstrap" first to create the environment file.')
      return
    }

    const envContent = await readFile(envFile, 'utf-8')
    const botTokenMatch = envContent.match(/^TG_BOT_TOKEN=(.+)$/m)
    botToken = botTokenMatch?.[1]?.trim()
  }

  if (!botToken) {
    cliLogger.error('TG_BOT_TOKEN not found')
    cliLogger.info('Please run "tbm bootstrap" first to configure the bot token.')
    return
  }

  let chatId = options.chatId
  if (!chatId) {
    chatId = await input({
      message: 'Enter the Chat ID of the group (must be a supergroup/forum):',
      validate: (value: string) => {
        if (!value || value.trim().length === 0) {
          return 'Chat ID is required'
        }
        const num = parseInt(value.trim(), 10)
        if (isNaN(num) || num >= 0) {
          return 'Chat ID must be a negative number (e.g., -1001234567890)'
        }
        return true
      },
    })
  }

  const chatIdNum = parseInt(chatId, 10)

  let topics: string[] = []
  if (options.topics) {
    topics = options.topics.split(',').map((t) => t.trim())
  } else {
    const selectedTopics = await checkbox({
      message: 'Select topics to create:',
      choices: [
        { name: 'General', value: 'General', checked: true },
        { name: 'Control', value: 'Control', checked: true },
        { name: 'Logs', value: 'Logs', checked: true },
        { name: 'Config', value: 'Config', checked: true },
        { name: 'Bugs', value: 'Bugs', checked: true },
      ],
    })

    if (selectedTopics.length === 0) {
      cliLogger.warn('No topics selected. Exiting...')
      return
    }

    topics = selectedTopics as string[]
  }

  cliLogger.info(`Creating ${topics.length} topics in chat ${chatId}`)
  cliLogger.info('')

  const shouldCreate = await confirm({
    message: 'Continue?',
    default: true,
  })

  if (!shouldCreate) {
    cliLogger.info('Operation cancelled')
    return
  }

  const spinner = ora({
    text: 'Creating topics...',
    color: 'cyan',
  }).start()

  try {
    const telegram = new Telegram(botToken)
    const createdTopics: Array<{ name: string; threadId: number }> = []

    for (const topicName of topics) {
      try {
        spinner.text = `Creating topic: ${topicName}...`

        const result = await telegram.createForumTopic(chatIdNum, topicName, {
          icon_color: getRandomTopicColor() as 7322096,
        })

        if (result?.message_thread_id) {
          createdTopics.push({
            name: topicName,
            threadId: result.message_thread_id,
          })
          spinner.succeed(`Created: ${topicName} (ID: ${result.message_thread_id})`)
          spinner.start()

          await sleep(500)
        }
      } catch (error) {
        spinner.fail(`Failed to create topic: ${topicName}`)
        if (error instanceof Error) {
          cliLogger.error(`  Error: ${error.message}`)
        }
        spinner.start()
      }
    }

    spinner.stop()

    printTitle('📊 Summary')

    if (createdTopics.length > 0) {
      cliLogger.success(`Created ${createdTopics.length} topics:`)
      cliLogger.info('')

      for (const topic of createdTopics) {
        cliLogger.info(`  ${topic.name}: ${topic.threadId}`)
      }

      cliLogger.info('')

      const shouldUpdate = await confirm({
        message: 'Update .env file with topic IDs?',
        default: true,
      })

      if (shouldUpdate) {
        let envFile: string
        let envContent: string

        if (activeBot) {
          envFile = resolve(process.cwd(), 'core', '.envs', activeBot, `${environment}.env`)
        } else {
          envFile = resolve(process.cwd(), 'core', `.env.${environment}`)
        }

        if (existsSync(envFile)) {
          envContent = await readFile(envFile, 'utf-8')

          for (const topic of createdTopics) {
            const envKey = getEnvKeyForTopic(topic.name)
            if (envKey) {
              envContent = updateEnvVar(envContent, envKey, String(topic.threadId))
            }
          }

          await writeFile(envFile, envContent, 'utf-8')
          cliLogger.success(`Updated ${envFile}`)
        } else {
          cliLogger.warn(`Could not find env file: ${envFile}`)
        }
      } else {
        cliLogger.info('.env file was not updated')
      }
    } else {
      cliLogger.warn('No topics were created')
    }
  } catch (error) {
    spinner.stop()
    cliLogger.error('Failed to create topics')
    if (error instanceof Error) {
      cliLogger.error(`  ${error.message}`)
    }
  }
}
