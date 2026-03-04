type LogLevel = "INFO" | "WARN" | "ERROR";

type LogPayload = Record<string, unknown> | undefined;

const write = (level: LogLevel, message: string, payload?: LogPayload) => {
  const log = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...payload,
  };

  if (level === "ERROR") {
    console.error(JSON.stringify(log));
    return;
  }

  console.log(JSON.stringify(log));
};

export const logger = {
  info: (message: string, payload?: LogPayload) => write("INFO", message, payload),
  warn: (message: string, payload?: LogPayload) => write("WARN", message, payload),
  error: (message: string, payload?: LogPayload) => write("ERROR", message, payload),
};
