type LogLevel = 'info' | 'warn' | 'error' | 'debug'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || 'info'] || 1

function formatMessage(level: LogLevel, message: string, data?: any): string {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  if (data !== undefined) {
    return `${prefix} ${message} ${typeof data === 'string' ? data : JSON.stringify(data)}`
  }
  return `${prefix} ${message}`
}

export const logger = {
  debug: (message: string, data?: any) => {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.debug(formatMessage('debug', message, data))
    }
  },

  info: (message: string, data?: any) => {
    if (currentLevel <= LOG_LEVELS.info) {
      console.log(formatMessage('info', message, data))
    }
  },

  warn: (message: string, data?: any) => {
    if (currentLevel <= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, data))
    }
  },

  error: (message: string, error?: any) => {
    if (currentLevel <= LOG_LEVELS.error) {
      console.error(formatMessage('error', message, error))
    }
  },
}
