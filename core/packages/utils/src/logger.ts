/**
 * Logging utility basado en @mks2508/better-logger.
 *
 * Configura el preset cyberpunk y exporta funciones para crear loggers nombrados.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { createLogger } from 'mks2508/utils/logger';
 *
 * const log = createLogger('MyComponent');
 *
 * log.info('Started');
 * log.error('Failed to connect', { error });
 * log.success('Completed');
 * ```
 */

import logger, { component, type LogLevel } from '@mks2508/better-logger';

/**
 * Aplica el preset cyberpunk al logger principal.
 *
 * Este preset proporciona colores profesionales para operaciones de logging.
 *
 * @see {@link https://github.com/mks2508/better-logger | better-logger documentation}
 */
logger.preset('cyberpunk');

/**
 * Logger principal configurado con preset cyberpunk.
 *
 * @example
 * ```typescript
 * import { logger } from 'mks2508/utils/logger';
 *
 * logger.info('Application started');
 * logger.success('Operation completed');
 * ```
 */
export { logger };

/**
 * Crea un logger nombrado para un componente especifico.
 *
 * @param name - Nombre del logger/componente
 * @returns Logger con prefijo de componente
 *
 * @example
 * ```typescript
 * const log = createLogger('MyService');
 * log.info('Service started'); // [MyService] Service started
 * ```
 */
export const createLogger = (name: string) => component(name);

/**
 * Niveles de log disponibles.
 *
 * @example
 * ```typescript
 * import type { LogLevel } from 'mks2508/utils/logger';
 *
 * const level: LogLevel = 'info';
 * ```
 */
export type { LogLevel };
