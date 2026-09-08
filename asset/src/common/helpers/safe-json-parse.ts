export const safeJsonParse = (str: string): unknown | undefined => {
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
};
