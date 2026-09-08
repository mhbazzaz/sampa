import { Client } from '@elastic/elasticsearch';
import { Dotenv } from 'src/config/dotenv';

export class ElasticsearchClient {
  static #instance: ElasticsearchClient;
  public client: Client;

  private constructor() {}

  public static get instance(): ElasticsearchClient {
    if (!ElasticsearchClient.#instance) {
      console.log('No ElasticsearchClient Instance');

      ElasticsearchClient.#instance = new ElasticsearchClient();
      ElasticsearchClient.#instance.client = new Client({
        node: Dotenv.instance.env.ELASTIC_HOST,
        auth: {
          username: Dotenv.instance.env.ELASTIC_USERNAME,
          password: Dotenv.instance.env.ELASTIC_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    return ElasticsearchClient.#instance;
  }
}
