import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import {
  DeepPartial,
  FindOneOptions,
  FindOptionsWhere,
  QueryRunner,
  Repository,
} from 'typeorm';
import { AssessmentTeam } from '../entities/assessment-team.entity';

@Injectable()
export class AssessmentTeamRepository extends AbstractRepository<AssessmentTeam> {
  constructor(
    @InjectRepository(AssessmentTeam)
    private assessmentTeamRepository: Repository<AssessmentTeam>,
    private i18nService: I18nService,
  ) {
    super(assessmentTeamRepository, i18nService);
  }

  //------------------------------
  async findOneTransactionable(
    data: FindOneOptions<AssessmentTeam>,
    queryRunner: QueryRunner,
  ) {
    return queryRunner.manager.findOne(AssessmentTeam, data);
  }

  //------------------------------
  async findAndDeleteTransactionable(
    where: FindOptionsWhere<AssessmentTeam>,
    queryRunner: QueryRunner,
  ) {
    return queryRunner.manager.softDelete(AssessmentTeam, where);
  }

  //------------------------------
  async saveTransactionable(
    entity: DeepPartial<AssessmentTeam>,
    queryRunner: QueryRunner,
  ) {
    return queryRunner.manager.save(AssessmentTeam, entity);
  }
}
