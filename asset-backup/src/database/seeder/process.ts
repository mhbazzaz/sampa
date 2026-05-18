import { ProcessEnum } from 'src/common/enums/process.enum';
import { Process } from 'src/process/entities/process.entity';
import { DataSource } from 'typeorm';

const processes: {
  name: string;
}[] = [
  {
    name: ProcessEnum.AssetManagement,
  },
];

export const ProcessSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < processes.length; i++) {
    const element = processes[i];
    const record = await datasource
      .getRepository(Process)
      .findOne({ where: { name: element.name } });

    if (record) {
      continue;
    }
    const process = new Process(element);

    await datasource.getRepository(Process).save({ ...process });
  }

  return true;
};
