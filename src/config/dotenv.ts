import * as dotenv from 'dotenv';
import {
  boolean,
  InferType,
  number,
  object,
  string,
  ValidationError,
} from 'yup';

const envSchema = object({
  NODE_ENV: string().trim().required(),
  APPLICATION_PORT: number().required(),
  DATABASE_TYPE: string().trim().required(),
  DATABASE_HOST: string().trim().required(),
  DATABASE_PORT: number().required(),
  DATABASE_USERNAME: string().trim().required(),
  DATABASE_PASSWORD: string().trim().required(),
  DATABASE_NAME: string().trim().required(),
  DATABASE_SYNCHRONIZE: boolean().optional(),
  DATABASE_LOGGING: boolean().optional(),
  SWAGGER_USERNAME: string().trim().required(),
  SWAGGER_PASSWORD: string().trim().required(),
  RABBITMQ_HOST: string().trim().required(),
  RABBITMQ_USERNAME: string().trim().required(),
  RABBITMQ_PASSWORD: string().trim().required(),
  HASHICORP_VAULT_URL: string().trim().required(),
  HASHICORP_VAULT_USERNAME: string().trim().required(),
  HASHICORP_VAULT_PASSWORD: string().trim().required(),
  HASHICORP_VAULT_DIRECTORY: string().trim().required(),
  TEXT_EDITOR_FILE_UPLOAD_MAX_SIZE_KILOBYTE: number().optional(),
});

export class Dotenv {
  static #instance: Dotenv;
  public env: InferType<typeof envSchema>;

  private constructor() {}

  public static get instance(): Dotenv {
    if (!Dotenv.#instance) {
      let configFile: string;
      switch (process.env.NODE_ENV) {
        case 'production':
          configFile = '.env';
          break;
        case 'development':
          configFile = '.env.development.local';
          break;
        case 'test':
          configFile = '.env.test.local';
          break;
        default:
          configFile = '.env';
          break;
      }

      dotenv.config({ path: configFile });
      try {
        const instance = new Dotenv();
        instance.env = envSchema.validateSync(process.env, {
          abortEarly: false,
          stripUnknown: true,
        });
        Dotenv.#instance = instance;
      } catch (error) {
        if (error instanceof ValidationError) {
          console.log(error.errors);
        }
        throw error;
      }
    }

    return Dotenv.#instance;
  }
}
