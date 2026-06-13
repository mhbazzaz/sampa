import { NotFoundException } from '@nestjs/common';
import { Action } from 'src/action/entities/action.entity';
import { ActionTierEnum } from 'src/common/enums/action-tier.enum';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { Process } from 'src/process/entities/process.entity';
import { DataSource } from 'typeorm';

const actions: {
  name: string;
  tier: ActionTierEnum;
  processName: string;
}[] = [
  {
    name: ActionEnum.Save,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssetManagement,
  },
  {
    name: ActionEnum.Register,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssetManagement,
  },
  {
    name: ActionEnum.Confirm,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssetManagement,
  },
  {
    name: ActionEnum.Read,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssetManagement,
  },
  {
    name: ActionEnum.Delete,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssetManagement,
  },
  {
    name: ActionEnum.Edit,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssetManagement,
  },
  {
    name: ActionEnum.GetReport,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssetManagement,
  },
  {
    name: ActionEnum.UpdateLogSourceState,
    tier: ActionTierEnum.BACKEND,
    processName: ProcessEnum.AssetManagement,
  },
];

export const ActionSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < actions.length; i++) {
    const { processName, ...element } = actions[i];

    const process = await datasource
      .getRepository(Process)
      .findOne({ where: { name: processName } });
    if (!process) {
      console.log(processName);
      throw new NotFoundException('process');
    }

    const record = await datasource.getRepository(Action).findOne({
      where: {
        name: element.name,
        tier: element.tier,
        processId: process.id,
      },
    });

    if (record) {
      continue;
    }
    const action = new Action(element);

    await datasource
      .getRepository(Action)
      .save({ ...action, processId: process.id });
  }

  return true;
};
