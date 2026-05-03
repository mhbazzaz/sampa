import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { Action } from '../entities/action.entity';

@Injectable()
export class ActionRepository extends AbstractRepository<Action> {
  constructor(
    @InjectRepository(Action)
    private actionRepository: Repository<Action>,
    private readonly i18nService: I18nService,
  ) {
    super(actionRepository, i18nService);
  }
}
