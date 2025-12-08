/* eslint-disable no-console */

const sanitizeError = error => {
  if (!error) {
    return undefined;
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
};

const buildEntry = (level, message, metadata = {}, error) => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  platform: 'mobile',
  ...metadata,
  ...(error ? { error: sanitizeError(error) } : {}),
});

export const logInfo = (message, metadata = {}) => {
  console.info(JSON.stringify(buildEntry('INFO', message, metadata)));
};

export const logWarn = (message, metadata = {}, error) => {
  console.warn(JSON.stringify(buildEntry('WARN', message, metadata, error)));
};

export const logError = (message, error, metadata = {}) => {
  console.error(JSON.stringify(buildEntry('ERROR', message, metadata, error)));
};

export const logDebug = (message, metadata = {}) => {
  console.debug(JSON.stringify(buildEntry('DEBUG', message, metadata)));
};
