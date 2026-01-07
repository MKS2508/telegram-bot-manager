import { EnvManager, type IConfiguredBot } from 'mks2508/main'
import { createLogger } from 'mks2508/utils'

const log = createLogger('Example')

log.info('Starting telegram-bot-manager example...')

// List configured bots
const envManager = new EnvManager()
const bots: IConfiguredBot[] = envManager.listBots()

log.info(`Found ${bots.length} configured bots:`)
bots.forEach((bot: IConfiguredBot) => {
  log.info(`  - @${bot.username} ${bot.isActive ? '(active)' : ''}`)
})

log.info('Example completed!')
