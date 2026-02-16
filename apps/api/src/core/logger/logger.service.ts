import { Injectable, LoggerService as NestLoggerService, LogLevel } from '@nestjs/common';

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    const logContext = context || this.context;
    this.printLog('log', message, logContext);
  }

  error(message: string, trace?: string, context?: string) {
    const logContext = context || this.context;
    this.printLog('error', message, logContext, trace);
  }

  warn(message: string, context?: string) {
    const logContext = context || this.context;
    this.printLog('warn', message, logContext);
  }

  debug(message: string, context?: string) {
    const logContext = context || this.context;
    this.printLog('debug', message, logContext);
  }

  verbose(message: string, context?: string) {
    const logContext = context || this.context;
    this.printLog('verbose', message, logContext);
  }

  fatal(message: string, trace?: string, context?: string) {
    const logContext = context || this.context;
    this.printLog('fatal', message, logContext, trace);
  }

  private printLog(level: LogLevel, message: string, context?: string, trace?: string) {
    const timestamp = new Date().toISOString();
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // 프로덕션: JSON 형식 (구조화된 로깅)
      const logObject = {
        timestamp,
        level,
        context,
        message,
        ...(trace && { trace }),
      };
      console.log(JSON.stringify(logObject));
    } else {
      // 개발: 읽기 쉬운 형식
      const contextString = context ? `[${context}] ` : '';
      const emoji = this.getEmoji(level);

      switch (level) {
        case 'fatal':
        case 'error':
          console.error(`${emoji} ${contextString}${message}`);
          if (trace) console.error(trace);
          break;
        case 'warn':
          console.warn(`${emoji} ${contextString}${message}`);
          break;
        case 'debug':
          console.debug(`${emoji} ${contextString}${message}`);
          break;
        case 'verbose':
          console.log(`${emoji} ${contextString}${message}`);
          break;
        default:
          console.log(`${emoji} ${contextString}${message}`);
      }
    }
  }

  private getEmoji(level: LogLevel): string {
    const emojiMap: Record<LogLevel, string> = {
      log: '📝',
      error: '❌',
      warn: '⚠️',
      debug: '🔍',
      verbose: '💬',
      fatal: '💀',
    };
    return emojiMap[level] || '📝';
  }
}
