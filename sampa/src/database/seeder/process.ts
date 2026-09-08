import { ProcessEnum } from 'src/common/enums/process.enum';
import { Process } from 'src/process/entities/process.entity';
import { DataSource } from 'typeorm';

const processes: {
  name: string;
}[] = [
  {
    name: ProcessEnum.AssessmentRequest,
  },
  {
    name: ProcessEnum.AssessmentLayer,
  },
];

export const ProcessSeeder = async (datasource: DataSource) => {
  const oldProcess = await datasource.getRepository(Process).find();
  for (let i = 0; i < oldProcess.length; i++) {
    const element = oldProcess[i];
    const fi = processes.findIndex((process) => process.name === element.name);
    if (fi === -1) {
      try {
        await datasource.getRepository(Process).remove(element);
      } catch (error) {
        console.log("couldn't delete", error);
      }
    }
  }

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
