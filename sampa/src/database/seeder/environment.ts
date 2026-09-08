import { Environment } from 'src/environment/entities/environment.entity';
import { DataSource } from 'typeorm';

const environments: { id: string; name: string }[] = [
  {
    id: '6996554e-44ee-4f60-85d0-006ac034b436',
    name: 'Operation',
  },
  {
    id: 'b2821152-e402-47a6-8a93-5a361186fc61',
    name: 'Staging',
  },
  {
    id: 'a78d084f-0a4a-48d5-95e2-7b0e03470a30',
    name: 'Development',
  },
];

export const EnvironmentSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < environments.length; i++) {
    const element = environments[i];

    const record = await datasource.getRepository(Environment).findOne({
      where: {
        id: element.id,
        name: element.name,
      },
    });

    if (record) {
      continue;
    }

    await datasource.getRepository(Environment).save(element);
  }

  return true;
};
