type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: any;
}

/**
 * Structured JSON Logger for Production Telemetry
 */
class ProductionLogger {
  private isDev = process.env.NODE_ENV === "development";

  private format(level: LogLevel, message: string, context?: string, metadata?: any): string {
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
    };

    return JSON.stringify(payload);
  }

  public info(message: string, context?: string, metadata?: any) {
    if (this.isDev) {
      console.log(`[INFO] [${context || "App"}] ${message}`, metadata ? metadata : "");
    } else {
      console.log(this.format("INFO", message, context, metadata));
    }
  }

  public warn(message: string, context?: string, metadata?: any) {
    if (this.isDev) {
      console.warn(`[WARN] [${context || "App"}] ${message}`, metadata ? metadata : "");
    } else {
      console.warn(this.format("WARN", message, context, metadata));
    }
  }

  public error(message: string, context?: string, metadata?: any, errorStack?: string) {
    if (this.isDev) {
      console.error(`[ERROR] [${context || "App"}] ${message}`, metadata ? metadata : "", errorStack ? `\nStack: ${errorStack}` : "");
    } else {
      console.error(this.format("ERROR", message, context, { ...metadata, errorStack }));
    }
  }

  public debug(message: string, context?: string, metadata?: any) {
    if (this.isDev) {
      console.debug(`[DEBUG] [${context || "App"}] ${message}`, metadata ? metadata : "");
    } else if (process.env.DEBUG === "true") {
      console.log(this.format("DEBUG", message, context, metadata));
    }
  }
}

export const logger = new ProductionLogger();
