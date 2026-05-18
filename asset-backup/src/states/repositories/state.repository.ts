import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { State } from '../entities/state.entity';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class StatesRepository extends AbstractRepository<State> {
  constructor(
    @InjectRepository(State)
    private assessmentLayerRepository: Repository<State>,
    private readonly i18nService: I18nService,
  ) {
    super(assessmentLayerRepository, i18nService);
  }
}
