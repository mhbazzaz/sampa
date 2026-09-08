import { fakerFA } from '@faker-js/faker';
import { Environment } from 'src/environment/entities/environment.entity';
import { DataSource } from 'typeorm';

export const EnvironmentFaker = async (datasource: DataSource) => {
  for (let i = 0; i < 10; i++) {
    const environment = new Environment({
      name: fakerFA.word.adjective(),
    });

    const record = await datasource
      .getRepository(Environment)
      .findOne({ where: { name: environment.name } });

    if (record) {
      continue;
    }

    await datasource.getRepository(Environment).save(environment);
  }

  return true;
};
