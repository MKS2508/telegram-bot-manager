/**
 * Tipos del dominio principal.
 *
 * @module
 */

/**
 * Opciones de configuracion para saludos.
 */
export interface IGreetOptions {
  /**
   * Prefijo del saludo (default: "Hello").
   */
  prefix?: string;

  /**
   * Sufijo del saludo (default: "!").
   */
  suffix?: string;
}

/**
 * Callback para notificar eventos.
 */
export type IEventCallback = (event: string) => void;
