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

export const botFatherLogger = component('BotFather')
export const messageLogger = component('Message')
export const buttonLogger = component('Button')
export const parserLogger = component('Parser')

export function debug(logger: ReturnType<typeof component>, ...args: unknown[]) {
  if (isDebug) {
    logger.debug(...args)
  }
}

export { isDebug }
