import { NotFoundException } from '@nestjs/common';
import { Action } from 'src/action/entities/action.entity';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AssetRoles } from 'src/common/enums/asset-roles.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { Process } from 'src/process/entities/process.entity';
import { Role } from 'src/role/entities/role.entity';
import { DataSource } from 'typeorm';

const actions: {
  actionNames: { name: string; process: string }[];
  roleName: string;
}[] = [
  {
    roleName: 'ciso',
    actionNames: [
      { name: ActionEnum.Save, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Register, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Confirm, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Read, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Delete, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Edit, process: ProcessEnum.AssetManagement },
    ],
  },
  // {
  //   roleName: 'applicant',
  //   actionNames: [
  //     { name: ActionEnum.Save, process: ProcessEnum.AssetManagement },
  //     { name: ActionEnum.Register, process: ProcessEnum.AssetManagement },
  //     { name: ActionEnum.Confirm, process: ProcessEnum.AssetManagement },
  //     { name: ActionEnum.Read, process: ProcessEnum.AssetManagement },
  //     { name: ActionEnum.Delete, process: ProcessEnum.AssetManagement },
  //     { name: ActionEnum.Edit, process: ProcessEnum.AssetManagement },
  //   ],
  // },
  // {
  //   roleName: 'applicant manager',
  //   actionNames: [
  //     { name: ActionEnum.Save, process: ProcessEnum.AssetManagement },
  //     { name: ActionEnum.Register, process: ProcessEnum.AssetManagement },
  //     { name: ActionEnum.Confirm, process: ProcessEnum.AssetManagement },
  //     { name: ActionEnum.Read, process: ProcessEnum.AssetManagement },
  //     { name: ActionEnum.Delete, process: ProcessEnum.AssetManagement },
  //     { name: ActionEnum.Edit, process: ProcessEnum.AssetManagement },
  //   ],
  // },
  {
    roleName: AssetRoles.AssetAdministrator,
    actionNames: [
      { name: ActionEnum.Save, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Register, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Confirm, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Read, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Delete, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Edit, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.GetReport, process: ProcessEnum.AssetManagement },
    ],
  },
  {
    roleName: AssetRoles.AssetSupervisor,
    actionNames: [
      { name: ActionEnum.Save, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Register, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Confirm, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Read, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Delete, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Edit, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.GetReport, process: ProcessEnum.AssetManagement },
    ],
  },
  {
    roleName: AssetRoles.AssetUser,
    actionNames: [
      { name: ActionEnum.Save, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Register, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Confirm, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Read, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Delete, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.Edit, process: ProcessEnum.AssetManagement },
    ],
  },
  {
    roleName: AssetRoles.AssetAuditor,
    actionNames: [
      { name: ActionEnum.Read, process: ProcessEnum.AssetManagement },
      { name: ActionEnum.GetReport, process: ProcessEnum.AssetManagement },
    ],
  },
];

export const ActionRoleSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < actions.length; i++) {
    const element = actions[i];
    const acts: Action[] = [];
    for (let j = 0; j < element.actionNames.length; j++) {
      const action = element.actionNames[j];

      const processRecord = await datasource
        .getRepository(Process)
        .findOne({ where: { name: action.process } });
      if (!processRecord) {
        console.log(action.process);
        throw new NotFoundException('process');
      }

      const actionRecord = await datasource
        .getRepository(Action)
        .findOne({ where: { name: action.name, processId: processRecord.id } });
      if (!actionRecord) {
        console.log(action.name, processRecord.name);
        throw new NotFoundException('actionRecord');
      }

      acts.push(actionRecord);
    }

    const roleRecord = await datasource
      .getRepository(Role)
      .findOne({ where: { name: element.roleName } });
    if (!roleRecord) {
      console.log(element.roleName);
      throw new NotFoundException('roleRecord');
    }
    roleRecord.actions = acts;

    await datasource.getRepository(Role).save(roleRecord);
  }

  return true;
};
