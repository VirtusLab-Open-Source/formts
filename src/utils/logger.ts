const warn = (message?: unknown, ...params: unknown[]) => {
  // TODO: is that the way to check for DEV consumer side?
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(message, ...params);
  }
};

export const logger = { warn };
