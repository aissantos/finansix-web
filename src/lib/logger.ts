import winston from 'winston';

// Níveis de log customizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Cores para console
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Formato de log para desenvolvimento
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.meta ? ` ${JSON.stringify(info.meta)}` : ''}`
  )
);

// Formato JSON para produção
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transports
const transports: winston.transport[] = [
  // Console para desenvolvimento
  new winston.transports.Console({
    format: import.meta.env.DEV ? devFormat : prodFormat,
  }),
];

// Logger singleton
export const logger = winston.createLogger({
  level: import.meta.env.DEV ? 'debug' : 'info',
  levels,
  transports,
  // Prevent winston from exiting on error
  exitOnError: false,
});

// Helper functions com suporte a metadata
export const log = {
  error: (message: string, meta?: Record<string, unknown>) => {
    logger.error(message, { meta });
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    logger.warn(message, { meta });
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(message, { meta });
  },
  http: (message: string, meta?: Record<string, unknown>) => {
    logger.http(message, { meta });
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    logger.debug(message, { meta });
  },
};
