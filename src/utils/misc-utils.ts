export const assertNever = (_it: never): never => {
  throw new Error("Illegal state");
};
