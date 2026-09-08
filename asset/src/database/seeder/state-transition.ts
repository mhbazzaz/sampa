import { NotFoundException } from '@nestjs/common';
import { Action } from 'src/action/entities/action.entity';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { Process } from 'src/process/entities/process.entity';
import { StateTransition } from 'src/state-transition/entities/state-transition.entity';
import { State } from 'src/states/entities/state.entity';
import { DataSource } from 'typeorm';

const stateTransitions: {
  process: string;
  currentState: string;
  nextState: string;
  action: string;
}[] = [
  {
    process: ProcessEnum.AssetManagement,
    currentState: 'initiated',
    nextState: 'draft',
    action: ActionEnum.Save,
  },
  {
    process: ProcessEnum.AssetManagement,
    currentState: 'initiated',
    nextState: 'submitted',
    action: ActionEnum.Register,
  },
  {
    process: ProcessEnum.AssetManagement,
    currentState: 'draft',
    nextState: 'submitted',
    action: ActionEnum.Register,
  },
  {
    process: ProcessEnum.AssetManagement,
    currentState: 'submitted',
    nextState: 'confirmed',
    action: ActionEnum.Confirm,
  },
  {
    process: ProcessEnum.AssetManagement,
    currentState: 'confirmed',
    nextState: 'modified',
    action: ActionEnum.Edit,
  },
  {
    process: ProcessEnum.AssetManagement,
    currentState: 'modified',
    nextState: 'confirmed',
    action: ActionEnum.Confirm,
  },
];

export const stateTransitionSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < stateTransitions.length; i++) {
    const element = stateTransitions[i];
    const currentState = await datasource
      .getRepository(State)
      .findOne({ where: { name: element.currentState } });
    if (!currentState) {
      console.log(element.currentState);
      throw new NotFoundException('currentState');
    }

    const nextState = await datasource
      .getRepository(State)
      .findOne({ where: { name: element.nextState } });
    if (!nextState) {
      console.log(element.nextState);
      throw new NotFoundException('nextState');
    }

    const process = await datasource
      .getRepository(Process)
      .findOne({ where: { name: element.process } });
    if (!process) {
      console.log(element.process);
      throw new NotFoundException('process');
    }

    const action = await datasource
      .getRepository(Action)
      .findOne({ where: { name: element.action, processId: process.id } });
    if (!action) {
      console.log(element.action);
      throw new NotFoundException(AuthorizationMetaDataEnum.Action);
    }

    const record = await datasource.getRepository(StateTransition).findOne({
      where: {
        currentStateId: currentState.id,
        nextStateId: nextState.id,
        processId: process.id,
        actionId: action.id,
      },
    });

    if (record) {
      continue;
    }

    const stateTransition = new StateTransition({});
    stateTransition.currentStateId = currentState.id;
    stateTransition.nextStateId = nextState.id;
    stateTransition.processId = process.id;
    stateTransition.actionId = action.id;
    datasource.getRepository(StateTransition).save(stateTransition);
  }

  return true;
};
