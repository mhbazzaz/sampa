import { FieldResolver } from './field-resolver.interface';

export interface ChangelogConfig {
  fieldResolvers: Record<string, FieldResolver>;
  trackedFields: string[];
  fetchUsers?: (userIds: string[]) => Promise<Map<string, any>>;
}
