import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { State } from 'src/states/entities/state.entity';
import { StateTransition } from '../entities/state-transition.entity';
import { StateTransitionRepository } from '../repositories/state-transition.repository';

@Injectable()
export class StateTransitionService {
  constructor(
    private readonly stateTransitionRepository: StateTransitionRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async findAll(): Promise<StateTransition[]> {
    return this.stateTransitionRepository.findAll({
      relations: { action: true, nextState: true, process: true },
    });
  }

  //------------------------------
  async getNextStatus(input: {
    processId: string;
    actionId: string;
    currentStateId: string;
  }): Promise<State> {
    const stateTransition = await this.stateTransitionRepository.findOne({
      where: {
        processId: input.processId,
        actionId: input.actionId,
        currentStateId: input.currentStateId,
      },
      relations: { nextState: true },
    });

    if (!stateTransition || !stateTransition.nextState) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'state transition' },
        }),
      );
    }

    return stateTransition.nextState;
  }

  //------------------------------
  async getAllNextStatus(input: {
    processId: string;
    actionId: string;
  }): Promise<State[]> {
    const stateTransition = await this.stateTransitionRepository.findAll({
      where: {
        processId: input.processId,
        actionId: input.actionId,
      },
      relations: { nextState: true },
    });

    const nextStates: State[] = [];

    for (let i = 0; i < stateTransition.length; i++) {
      const element = stateTransition[i];

      if (element.nextState) {
        nextStates.push(element.nextState);
      }
    }

    if (nextStates.length === 0) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'state transition' },
        }),
      );
    }

    return nextStates;
  }
}
