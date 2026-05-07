type LogLevel = "debug" | "info" | "warn" | "error";

type LogEntry = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
};

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = { level, message, context, timestamp: new Date().toISOString() };
  if (process.env.NODE_ENV === "production") {
    process.stdout.write(JSON.stringify(entry) + "\n");
  } else {
    const colors: Record<LogLevel, string> = {
      debug: "\x1b[36m", info: "\x1b[32m", warn: "\x1b[33m", error: "\x1b[31m",
    };
    process.stdout.write(`${colors[level]}[${level.toUpperCase()}]\x1b[0m ${message}${context ? " " + JSON.stringify(context) : ""}\n`);
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
  info:  (msg: string, ctx?: Record<string, unknown>) => log("info",  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => log("warn",  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
};
