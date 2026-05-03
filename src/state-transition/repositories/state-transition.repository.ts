import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { StateTransition } from '../entities/state-transition.entity';

@Injectable()
export class StateTransitionRepository extends AbstractRepository<StateTransition> {
  constructor(
    @InjectRepository(StateTransition)
    private assessmentLayerRepository: Repository<StateTransition>,
    private readonly i18nService: I18nService,
  ) {
    super(assessmentLayerRepository, i18nService);
  }
}
