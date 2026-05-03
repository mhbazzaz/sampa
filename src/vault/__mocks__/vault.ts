export class Vault {
  static #instance: Vault;

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

  // login = jest.fn().mockImplementation();
  // get = jest.fn().mockImplementation();
  login = jest.fn().mockResolvedValue(undefined);
  get = jest.fn().mockResolvedValue('mockedValue');
}
