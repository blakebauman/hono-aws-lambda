import { env } from "./env";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (env.NODE_ENV === "development") {
      console.debug(JSON.stringify(this.formatLog("debug", message, meta)));
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    console.log(JSON.stringify(this.formatLog("info", message, meta)));
  }

  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(JSON.stringify(this.formatLog("warn", message, meta)));
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>) {
    const errorMeta: Record<string, unknown> = {
      ...meta,
    };

    if (error instanceof Error) {
      errorMeta.error = {
        name: error.name,
        message: error.message,
        stack: env.NODE_ENV === "development" ? error.stack : undefined,
      };
    } else if (error) {
      errorMeta.error = String(error);
    }

    console.error(JSON.stringify(this.formatLog("error", message, errorMeta)));
  }
}

export const logger = new Logger();
