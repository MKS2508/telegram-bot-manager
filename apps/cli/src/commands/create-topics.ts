import { Command } from 'commander'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { resolve } from 'path'
import chalk from 'chalk'
import { input, confirm, checkbox } from '@inquirer/prompts'
import { Telegram } from 'telegraf'
import ora from 'ora'
import type { BotCommand } from './index.js'

const cliLogger = {
  info: (msg: string) => console.log(chalk.blue('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✓'), msg),
  error: (msg: string) => console.error(chalk.red('✗'), msg),
  warn: (msg: string) => console.log(chalk.yellow('⚠'), msg),
  title: (msg: string) => console.log(chalk.cyan.bold('\n' + msg + '\n')),
}

interface CreateTopicsCommand extends BotCommand {
  name: 'create-topics'
  description: string
  register: (program: Command) => void
}

interface CreateTopicsOptions {
  chatId?: string
  topics?: string
  environment?: 'local' | 'staging' | 'production'
}

const command: CreateTopicsCommand = {
  name: 'create-topics',
  description: 'Create forum topics in a Telegram group',

  register(program: Command) {
    program
      .command('create-topics')
      .description('Create forum topics in a Telegram group')
      .option('-c, --chat-id <value>', 'Chat ID of the group (must be a supergroup/forum)')
      .option('-t, --topics <list>', 'Comma-separated list of topic names')
      .option('-e, --environment <local|staging|production>', 'Target environment', 'local')
      .action(async (options) => {
        await handleCreateTopics(options)
      })
  },
}

export default command
export { handleCreateTopics }

async function handleCreateTopics(options: CreateTopicsOptions): Promise<void> {
  cliLogger.title('🧵 Create Forum Topics')

  const environment = options.environment ?? 'local'
  const envFile = resolve(process.cwd(), 'core', `.env.${environment}`)

  // Verify .env file exists
  if (!existsSync(envFile)) {
    cliLogger.error(`Environment file not found: ${envFile}`)
    cliLogger.info('Please run "bun run setup" first to create the environment file.')
    return
  }

  // Load bot token from .env file
  const envContent = await readFile(envFile, 'utf-8')
  const botTokenMatch = envContent.match(/^TG_BOT_TOKEN=(.+)$/m)
  const botToken = botTokenMatch?.[1]?.trim()

  if (!botToken) {
    cliLogger.error('TG_BOT_TOKEN not found in environment file')
    cliLogger.info('Please run "bun run setup" first to configure the bot token.')
    return
  }

  // Get chat ID
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

  // Get topics to create
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
  console.log('')

  const shouldCreate = await confirm({
    message: 'Continue?',
    default: true,
  })

  if (!shouldCreate) {
    cliLogger.info('Operation cancelled')
    return
  }

  // Create topics
  const spinner = ora({
    text: `Creating topics...`,
    color: 'cyan',
  }).start()

  try {
    const telegram = new Telegram(botToken)
    const createdTopics: Array<{ name: string; threadId: number }> = []

    for (const topicName of topics) {
      try {
        spinner.text = `Creating topic: ${topicName}...`

        const result = await telegram.createForumTopic(chatIdNum, topicName, {
          icon_color: getRandomColor() as 7322096,
        })

        if (result && result.message_thread_id) {
          createdTopics.push({
            name: topicName,
            threadId: result.message_thread_id,
          })
          spinner.succeed(chalk.green(`Created: ${topicName} (ID: ${result.message_thread_id})`))

          // Small delay to avoid rate limiting
          await sleep(500)
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to create topic: ${topicName}`))
        if (error instanceof Error) {
          console.error(chalk.dim(`  Error: ${error.message}`))
        }
      }
    }

    spinner.stop()

    // Summary
    console.log('')
    cliLogger.title('📊 Summary')

    if (createdTopics.length > 0) {
      cliLogger.success(`Created ${createdTopics.length} topics:`)
      console.log('')

      for (const topic of createdTopics) {
        console.log(`  ${chalk.cyan(topic.name)}: ${chalk.yellow(String(topic.threadId))}`)
      }

      console.log('')

      // Ask if user wants to update .env
      const shouldUpdate = await confirm({
        message: 'Update .env file with topic IDs?',
        default: true,
      })

      if (shouldUpdate) {
        await updateEnvFile(envFile, envContent, createdTopics)
        cliLogger.success(`Updated ${envFile}`)
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
      console.error(chalk.dim(`  ${error.message}`))
    }
  }
}

/**
 * Get a random color for topic icon
 */
function getRandomColor(): number {
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
 * Sleep for ms milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Update .env file with topic IDs
 */
async function updateEnvFile(
  envFile: string,
  content: string,
  createdTopics: Array<{ name: string; threadId: number }>
): Promise<void> {
  let updatedContent = content

  for (const topic of createdTopics) {
    const envKey = getEnvKeyForTopic(topic.name)
    if (envKey) {
      updatedContent = updateEnvVar(updatedContent, envKey, String(topic.threadId))
    }
  }

  await writeFile(envFile, updatedContent, 'utf-8')
}

/**
 * Get the environment variable key for a topic name
 */
function getEnvKeyForTopic(topicName: string): string | null {
  switch (topicName.toLowerCase()) {
    case 'control':
      return 'TG_CONTROL_TOPIC_ID'
    case 'logs':
    case 'log':
      return 'TG_LOG_TOPIC_ID'
    default:
      return null
  }
}

/**
 * Update a single environment variable in the content
 */
function updateEnvVar(content: string, key: string, value: string): string {
  // Check if variable exists (not commented)
  const exists = new RegExp(`^${key}=(.+)$`, 'm').test(content)

  if (exists) {
    // Update existing variable
    return content.replace(new RegExp(`^${key}=(.+)$`, 'm'), `${key}=${value}`)
  }

  // Check if variable is commented out
  const commentedMatch = content.match(new RegExp(`^#\\s*${key}=(.+)$`, 'm'))
  if (commentedMatch) {
    // Uncomment and update
    return content.replace(new RegExp(`^#\\s*${key}=(.+)$`, 'm'), `${key}=${value}`)
  }

  // Add new variable at the end
  return content.trimEnd() + `\n${key}=${value}\n`
}
