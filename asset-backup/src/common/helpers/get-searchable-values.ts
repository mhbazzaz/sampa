type JSONSchema = {
  type?: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  metadata?: { isSearchable?: boolean };
  [key: string]: any;
};

export const getSearchablePaths = (
  schema: JSONSchema,
  parentPath = '',
): string[] => {
  const paths: string[] = [];

  if (schema.metadata?.isSearchable) {
    paths.push(parentPath);
  }

  if (schema.type === 'object' && schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      const fullPath = parentPath ? `${parentPath}.${key}` : key;
      paths.push(...getSearchablePaths(value, fullPath));
    }
  } else if (schema.type === 'array' && schema.items) {
    const arrayPath = parentPath ? `${parentPath}[]` : '';
    paths.push(...getSearchablePaths(schema.items, arrayPath));
  }

  return paths;
};

export const getValuesFromJSON = (
  json: any,
  paths: string[],
): Record<string, any> => {
  const result: Record<string, any> = {};

  for (const path of paths) {
    const keys = path.replace(/\[\]$/, '').split('.');
    let value = json;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        value = undefined;
        break;
      }
    }
    if (value !== undefined) result[path] = value;
  }

  return result;
};
