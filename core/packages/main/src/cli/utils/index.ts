/**
 * CLI utilities barrel export.
 *
 * @module
 */

export {
  cliLogger,
  printTitle,
  enableSpinnerMode,
  disableSpinnerMode,
} from './logger.js'
export { SpinnerWriter, spinnerWriter } from './spinner-writer.js'
export {
  generateRandomUsername,
  generateBotDisplayname,
  generateGroupName,
} from './names.js'
export {
  sleep,
  updateEnvVar,
  getApiCredentials,
  loadApiCredentialsFromEnv,
  getEnvKeyForTopic,
  getRandomTopicColor,
  updateEnvWithTopics,
  type IApiCredentials,
} from './helpers.js'
