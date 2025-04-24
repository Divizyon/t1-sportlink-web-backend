const logger = {
  info: (message: string): void => console.log(`[INFO] ${message}`),
  error: (message: string): void => console.error(`[ERROR] ${message}`),
  warn: (message: string): void => console.warn(`[WARN] ${message}`),
  debug: (message: string): void => console.debug(`[DEBUG] ${message}`)
};

export default logger; 