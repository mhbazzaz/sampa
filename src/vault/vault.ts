import axios from 'axios';
import { Dotenv } from 'src/config/dotenv';

export class Vault {
  static #instance: Vault;
  public token: string;

  public static get instance(): Vault {
    if (!Vault.#instance) {
      try {
        const instance = new Vault();
        instance.login();
        Vault.#instance = instance;
      } catch (error) {
        throw error;
      }
    }
    return Vault.#instance;
  }

  //------------------------------
  login = async () => {
    try {
      const response = await axios.post<any>(
        `${Dotenv.instance.env.HASHICORP_VAULT_URL}/v1/auth/userpass/login/${Dotenv.instance.env.HASHICORP_VAULT_USERNAME}`,
        { password: Dotenv.instance.env.HASHICORP_VAULT_PASSWORD },
      );
      this.token = response.data.auth.client_token;
    } catch (error) {
      console.log('could not login to hashicorp');
      console.log(error);
      process.exit();
    }
  };

  //------------------------------
  get = async (
    key: string,
    directory = Dotenv.instance.env.HASHICORP_VAULT_DIRECTORY,
    alreadyFetched = false,
  ): Promise<string> => {
    try {
      const { data } = await axios.get(
        `${Dotenv.instance.env.HASHICORP_VAULT_URL}/v1/kv/data/secuscope/${directory}`,
        { headers: { 'X-Vault-Token': this.token } },
      );
      return data.data.data[key];
    } catch (error) {
      if (error.status === 403 && !alreadyFetched) {
        await this.login();
        const data = await this.get(key, directory, true);
        return data;
      }
      console.log(error.message);
      process.exit();
    }
  };
}
