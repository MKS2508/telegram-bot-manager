import { greet, createGreeter } from 'mks2508/core';
import { createLogger } from 'mks2508/utils/logger';

const log = createLogger('Example');

log.info('Starting example app...');

// Simple greeting
const result = greet('World');

if (result.isOk()) {
  log.success(result.value);
}

// Custom greeter
const spanishGreeter = createGreeter({ prefix: 'Hola' });
const spanishResult = spanishGreeter('Mundo');

if (spanishResult.isOk()) {
  log.success(spanishResult.value);
}

log.info('Example completed!');
