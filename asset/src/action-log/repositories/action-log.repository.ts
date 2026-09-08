import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { ActionLog } from '../entities/action-log.entity';

@Injectable()
export class ActionLogRepository extends AbstractRepository<ActionLog> {
  constructor(
    @InjectRepository(ActionLog)
    private actionLogRepository: Repository<ActionLog>,
    private readonly i18nService: I18nService,
  ) {
    super(actionLogRepository, i18nService);
  }
}
