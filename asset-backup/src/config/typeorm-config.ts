import { DataSourceOptions } from 'typeorm';
import { Dotenv } from './dotenv';

export const typeOrmConfig = {
  type: Dotenv.instance.env.DATABASE_TYPE,
  host: Dotenv.instance.env.DATABASE_HOST,
  port: Dotenv.instance.env.DATABASE_PORT,
  username: Dotenv.instance.env.DATABASE_USERNAME,
  password: Dotenv.instance.env.DATABASE_PASSWORD,
  database: Dotenv.instance.env.DATABASE_NAME,
  entities: [__dirname + '/../**/entities/*.entity.{js,ts}'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: Dotenv.instance.env.DATABASE_SYNCHRONIZE || false,
  logging: Dotenv.instance.env.DATABASE_LOGGING || false,
} as DataSourceOptions;
