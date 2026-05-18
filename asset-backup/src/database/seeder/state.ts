import { NotFoundException } from '@nestjs/common';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { Process } from 'src/process/entities/process.entity';
import { State } from 'src/states/entities/state.entity';
import { DataSource } from 'typeorm';

const states: {
  id?: string;
  name: string;
  processName: string;
}[] = [
  {
    id: '52264295-e05c-4bf7-bd0f-f519ff1e6fed',
    name: 'initiated',
    processName: ProcessEnum.AssetManagement,
  },
  {
    name: 'draft',
    processName: ProcessEnum.AssetManagement,
  },
  {
    name: 'submitted',
    processName: ProcessEnum.AssetManagement,
  },
  {
    name: 'confirmed',
    processName: ProcessEnum.AssetManagement,
  },
  {
    name: 'modified',
    processName: ProcessEnum.AssetManagement,
  },
];

export const StateSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < states.length; i++) {
    const { processName, ...element } = states[i];

    const process = await datasource
      .getRepository(Process)
      .findOne({ where: { name: processName } });
    if (!process) {
      console.log(processName);
      throw new NotFoundException('process');
    }

    const record = await datasource
      .getRepository(State)
      .findOne({ where: { name: element.name, processId: process.id } });

    if (record) {
      continue;
    }
    const state = new State(element);

    await datasource
      .getRepository(State)
      .save({ ...state, processId: process.id });
  }

  return true;
};
