import logger, { component } from '@mks2508/better-logger'

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const isDebug = LOG_LEVEL === 'debug'

if (isDebug) {
  logger.preset('debug')
  logger.showLocation()
} else {
  logger.preset('cyberpunk')
}
logger.showTimestamp()

const createLogger = (name: string) => component(name)

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
