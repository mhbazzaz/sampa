import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { GetActionLogQueryDto } from '../dto/input/get-action-log-query.dto';
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

  async getDetailedLogs(
    assessmentRequestId: string,
    query: GetActionLogQueryDto,
  ) {
    const queryBuilder = this.actionLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect(
        'log.assessmentRequestCurrentState',
        'assessmentRequestCurrentState',
      )
      .leftJoinAndSelect(
        'log.assessmentRequestNextState',
        'assessmentRequestNextState',
      )
      .leftJoinAndSelect(
        'log.assessmentLayerCurrentState',
        'assessmentLayerCurrentState',
      )
      .leftJoinAndSelect(
        'log.assessmentLayerNextState',
        'assessmentLayerNextState',
      )
      .where('log.assessmentRequestId = :assessmentRequestId', {
        assessmentRequestId,
      });

    if (query.layerIds && query.layerIds.length > 0) {
      queryBuilder.andWhere(
        '(log.assessmentLayerId IN (:...layerIds) OR log.assessmentLayerId IS NULL)',
        {
          layerIds: query.layerIds,
        },
      );
    }

    queryBuilder.orderBy('log.createdAt', 'ASC');

    return queryBuilder.getMany();
  }
}
