/**
 * telegram-bot-manager
 *
 * Telegram Bot management in Typescript, w/ GramJS / telegraf. Automates bot creation and management, bot and groups setups, etc. used y mks-scaffolder (telegram template) and mks2508-bot-father
 *
 * @module
 * @example
 * ```typescript
 * import { greet } from 'mks2508/core';
 * import { createLogger } from 'mks2508/utils/logger';
 *
 * const log = createLogger('Main');
 *
 * const result = greet('World');
 *
 * if (result.isErr()) {
 *   log.error('Failed', result.error);
 *   return;
 * }
 *
 * log.success(result.value);
 * ```
 */

import { ok, type Result, type ResultError } from 'mks2508/utils/result';
import type { AppErrorCode } from 'mks2508/utils/result';

// Importar tipos desde /types para uso interno
import type { IGreetOptions } from './types';

// Re-exportar tipos desde /types
export * from './types';

// Version del package
export const version = '0.1.0';

// Tipo de error
type AppError = ResultError<AppErrorCode>;

/**
 * Saluda a alguien con un mensaje personalizable.
 *
 * @param name - Nombre de la persona a saludar
 * @param options - Opciones de saludo
 * @returns Result con mensaje de saludo o error
 *
 * @example
 * ```typescript
 * const result = greet('World', { prefix: 'Hello' });
 * if (result.isOk()) {
 *   console.log(result.value); // "Hello, World!"
 * }
 * ```
 */
export function greet(
  name: string,
  options?: IGreetOptions
): Result<string, AppError> {
  const prefix = options?.prefix ?? 'Hello';
  const suffix = options?.suffix ?? '!';
  return ok(`${prefix}, ${name}${suffix}`);
}

/**
 * Factory function para crear un greeter configurado.
 *
 * @param defaultOptions - Opciones por defecto para todos los saludos
 * @returns Funcion greeter configurada
 *
 * @example
 * ```typescript
 * const spanishGreeter = createGreeter({ prefix: 'Hola' });
 * const result = spanishGreeter('Mundo'); // "Hola, Mundo!"
 * ```
 */
export function createGreeter(defaultOptions?: IGreetOptions) {
  return (name: string, options?: IGreetOptions): Result<string, AppError> => {
    return greet(name, { ...defaultOptions, ...options });
  };
}
