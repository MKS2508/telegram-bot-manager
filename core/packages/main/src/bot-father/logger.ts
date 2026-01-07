import { logger, createLogger } from 'mks2508/utils'

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const isDebug = LOG_LEVEL === 'debug'

if (isDebug) {
  logger.preset('debug')
  logger.showLocation()
}
logger.showTimestamp()

export const botFatherLogger = createLogger('BotFather')
export const messageLogger = createLogger('Message')
export const buttonLogger = createLogger('Button')
export const parserLogger = createLogger('Parser')

export function debug(log: ReturnType<typeof createLogger>, ...args: unknown[]) {
  if (isDebug) {
    log.debug(...args)
  }
}

export { isDebug }
