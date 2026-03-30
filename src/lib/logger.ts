type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

class Logger {
  private minLevel: LogLevel;

  constructor() {
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_PRIORITY[level] >= LOG_PRIORITY[this.minLevel];
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && Object.keys(context).length > 0 ? { context } : {}),
    };

    const output = JSON.stringify(entry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(msg: string, ctx?: Record<string, unknown>) {
    this.log('debug', msg, ctx);
  }

  info(msg: string, ctx?: Record<string, unknown>) {
    this.log('info', msg, ctx);
  }

  warn(msg: string, ctx?: Record<string, unknown>) {
    this.log('warn', msg, ctx);
  }

  error(msg: string, ctx?: Record<string, unknown>) {
    this.log('error', msg, ctx);
  }
}

export const logger = new Logger();
