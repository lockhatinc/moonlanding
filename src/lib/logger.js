import { headers } from 'next/headers';

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const MIN_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

function getTraceId() {
  const headersList = headers();
  return headersList.get('x-trace-id') || `trace-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatLog(level, context, message, data) {
  const timestamp = new Date().toISOString();
  const traceId = getTraceId();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${traceId}]`;

  if (data) {
    return `${prefix} ${context}: ${message} | ${typeof data === 'string' ? data : JSON.stringify(data)}`;
  }
  return `${prefix} ${context}: ${message}`;
}

export const logger = {
  error: (context, message, data) => {
    if (LOG_LEVELS.error <= MIN_LOG_LEVEL) {
      console.error(formatLog('error', context, message, data));
    }
  },

  warn: (context, message, data) => {
    if (LOG_LEVELS.warn <= MIN_LOG_LEVEL) {
      console.warn(formatLog('warn', context, message, data));
    }
  },

  info: (context, message, data) => {
    if (LOG_LEVELS.info <= MIN_LOG_LEVEL) {
      console.log(formatLog('info', context, message, data));
    }
  },

  debug: (context, message, data) => {
    if (LOG_LEVELS.debug <= MIN_LOG_LEVEL) {
      console.debug(formatLog('debug', context, message, data));
    }
  },

  errorWithStack: (context, message, error) => {
    if (LOG_LEVELS.error <= MIN_LOG_LEVEL) {
      const errorData = {
        message: error?.message,
        code: error?.code,
        stack: error?.stack?.split('\n').slice(0, 3).join(' | '),
      };
      console.error(formatLog('error', context, message, errorData));
    }
  },

  apiError: (method, endpoint, error) => {
    logger.errorWithStack(`API-${method}`, endpoint, error);
  },

  dbError: (operation, entity, error) => {
    logger.errorWithStack(`DB-${operation}`, entity, error);
  },

  authError: (operation, error) => {
    logger.errorWithStack('AUTH', operation, error);
  },

  fileError: (operation, file, error) => {
    logger.errorWithStack(`FILE-${operation}`, file, error);
  },
};
