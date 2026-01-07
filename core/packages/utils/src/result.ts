/**
 * Result pattern utilities basado en @mks2508/no-throw.
 *
 * Proporciona un tipo Result<T, E> para manejo de errores sin excepciones,
 * junto con funciones auxiliares para trabajar con Results.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { ok, err, tryCatch, type Result } from 'mks2508/utils/result';
 *
 * async function fetchData(url: string): Promise<Result<string, AppError>> {
 *   const result = await tryCatch(
 *     async () => {
 *       const response = await fetch(url);
 *       return await response.text();
 *     },
 *     AppErrorCode.NetworkError
 *   );
 *
 *   if (result.isErr()) {
 *     return createAppError(
 *       AppErrorCode.NetworkError,
 *       `Failed to fetch from ${url}`,
 *       result.error
 *     );
 *   }
 *
 *   return ok(result.value);
 * }
 * ```
 */

import {
  all,
  collect,
  err,
  fail,
  flatMap,
  fromPromise,
  isErr,
  isOk,
  map,
  mapErr,
  match,
  ok,
  tryCatch,
  tryCatchAsync,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  type Err,
  type Ok,
  type Result,
  type ResultError,
} from '@mks2508/no-throw';

export { all };
export { collect };
export { err };
export { fail };
export { flatMap };
export { fromPromise };
export { isErr };
export { isOk };
export { map };
export { mapErr };
export { match };
export { ok };
export { tryCatch };
export { tryCatchAsync };
export { unwrap };
export { unwrapOr };
export { unwrapOrElse };
export type { Result };
export type { Ok };
export type { Err };
export type { ResultError };

/**
 * Codigos de error de aplicacion.
 *
 * @example
 * ```typescript
 * import { AppErrorCode } from 'mks2508/utils/result';
 *
 * const code: AppErrorCode = AppErrorCode.NetworkError;
 * ```
 */
export const AppErrorCode = {
  /** Error de red o conexion fallida. */
  NetworkError: 'NETWORK_ERROR',
  /** Recurso no encontrado. */
  NotFound: 'NOT_FOUND',
  /** Permisos insuficientes. */
  PermissionDenied: 'PERMISSION_DENIED',
  /** Error de validacion. */
  ValidationError: 'VALIDATION_ERROR',
  /** Operacion cancelada. */
  Cancelled: 'CANCELLED',
} as const;

/**
 * Tipo de codigo de error de aplicacion.
 */
export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode];

/**
 * Crea un error de aplicacion con codigo, mensaje y causa opcional.
 *
 * @param code - Codigo de error de AppErrorCode
 * @param message - Mensaje descriptivo del error
 * @param cause - Error original que causo el fallo (opcional)
 * @returns Result con error de aplicacion
 *
 * @example
 * ```typescript
 * const error = createAppError(
 *   AppErrorCode.NetworkError,
 *   'Failed to connect to server',
 *   originalError
 * );
 * ```
 */
export const createAppError = (
  code: AppErrorCode,
  message: string,
  cause?: Error
): Result<never, ResultError<AppErrorCode>> => {
  return fail(code, message, cause);
};

/**
 * Tipo de error de aplicacion.
 *
 * @example
 * ```typescript
 * import type { AppError } from 'mks2508/utils/result';
 *
 * function handleError(error: AppError) {
 *   console.log(error.code);
 * }
 * ```
 */
export type AppError = ResultError<AppErrorCode>;
