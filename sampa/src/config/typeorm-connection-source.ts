import { DataSource } from 'typeorm';
import { typeOrmConfig } from './typeorm-config';

export const connectionSource = new DataSource(typeOrmConfig);
