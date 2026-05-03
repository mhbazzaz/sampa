import { Repository } from 'typeorm';

export interface FieldResolver {
  type: 'repository' | 'httpUser';
  repository?: Repository<any>;
  labelField?: string;
}
