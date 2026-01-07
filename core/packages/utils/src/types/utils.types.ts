/**
 * Tipos especificos del package mks2508/utils.
 *
 * @module
 */

/**
 * Nivel de log disponible.
 */
export type LogLevel =
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'success'
  | 'critical'
  | 'trace';

/**
 * Opciones para crear un logger nombrado.
 */
export interface ILoggerOptions {
  /**
   * Nombre del logger/componente.
   */
  name: string;

  /**
   * Nivel de log minimo (opcional).
   */
  minLevel?: LogLevel;
}
