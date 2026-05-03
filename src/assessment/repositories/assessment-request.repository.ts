import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { I18nService } from 'nestjs-i18n';
import { Action } from 'src/action/entities/action.entity';
import { AssetToAudit } from 'src/asset/entities/asset-to-audit.entity';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AbstractRepository } from 'src/database/abstract.repository';
import { GroupMembershipRepository } from 'src/group-membership/repositories/group-membership.repository';
import { Member } from 'src/member/entities/member.entity';
import { StateTransitionRepository } from 'src/state-transition/repositories/state-transition.repository';
import {
  DataSource,
  DeepPartial,
  FindOptionsWhere,
  In,
  QueryRunner,
  Repository,
} from 'typeorm';
import { AssessmentLayer } from '../entities/assessment-layer.entity';
import { AssessmentRequest } from '../entities/assessment-request.entity';

@Injectable()
export class AssessmentRequestRepository extends AbstractRepository<AssessmentRequest> {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AssessmentRequest)
    private assessmentRequestRepository: Repository<AssessmentRequest>,
    private groupMembershipRepository: GroupMembershipRepository,
    private stateTransitionRepository: StateTransitionRepository,
    private i18nService: I18nService,
  ) {
    super(assessmentRequestRepository, i18nService);
  }

  //------------------------------
  async createAssessmentRequest(data: {
    environmentId: string;
    asset: AssetToAudit;
    stateId: string;
    applicantId: string;
    assetToAuditBaseline: string;
    applicantManagerId: string;
    cisoId: string;
    code: string | undefined;
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = dayjs();
      const startOfYear = dayjs(now.year() + '-01-01');
      const dayOfYear = now.diff(startOfYear, 'day') + 1;
      const dayOfYearStr = dayOfYear.toString().padStart(3, '0');
      const yearShort = now.format('YY');

      const baseNumber = `${data.code}-${yearShort}${dayOfYearStr}`;

      const latestRequest = await queryRunner.manager
        .getRepository(AssessmentRequest)
        .createQueryBuilder('assessmentRequest')
        .setLock('pessimistic_write')
        .where('assessmentRequest.requestNumber LIKE :pattern', {
          pattern: `${baseNumber}-%`,
        })
        .orderBy('assessmentRequest.requestNumber', 'DESC')
        .getOne();

      let sequenceNumber = '01';
      if (latestRequest) {
        const lastSequence = latestRequest.requestNumber.split('-')[2];
        const nextNumber = parseInt(lastSequence, 10) + 1;
        if (nextNumber > 99) {
          throw new InternalServerErrorException(
            'Error during creating request number: sequence overflow',
          );
        }
        sequenceNumber = nextNumber.toString().padStart(2, '0');
      }

      const requestNumber = `${baseNumber}-${sequenceNumber}`;

      const assessmentRequest = queryRunner.manager.create(AssessmentRequest, {
        environmentId: data.environmentId,
        asset: data.asset,
        stateId: data.stateId,
        applicantId: data.applicantId,
        applicantManagerId: data.applicantManagerId,
        cisoId: data.cisoId,
        assetToAuditBaseline: data.assetToAuditBaseline,
        requestNumber,
      });

      const savedAssessmentRequest = await queryRunner.manager.save(
        AssessmentRequest,
        assessmentRequest,
      );

      await queryRunner.commitTransaction();
      return savedAssessmentRequest;
    } catch (err) {
      console.log(err.message);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  //------------------------------
  async createAssessmentLayer(data: {
    stateId: string;
    assessmentRequest: AssessmentRequest;
    assessmentTypeId: string;
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newLayer = queryRunner.manager.create(AssessmentLayer, {
        stateId: data.stateId,
        assessmentRequestId: data.assessmentRequest.id,
        assessmentTypeId: data.assessmentTypeId,
      });

      const savedLayer = await queryRunner.manager.save(
        AssessmentLayer,
        newLayer,
      );

      await queryRunner.commitTransaction();
      return savedLayer;
    } catch (err) {
      console.log(err.message);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  //------------------------------
  async getAssessmentRequestById(id: string) {
    return this.findOne({
      where: { id },
      relations: [
        'environment',
        'assesmentLayers',
        'assesmentLayers.assessmentType',
        'asset',
      ],
    });
  }

  //------------------------------
  async updateTransactionable(
    id: string,
    entity: DeepPartial<AssessmentRequest>,
    queryRunner: QueryRunner,
  ) {
    return queryRunner.manager.update(AssessmentRequest, id, entity);
  }

  //------------------------------
  async getLastRequest(baseNumber: string): Promise<AssessmentRequest | null> {
    return await this.assessmentRequestRepository
      .createQueryBuilder('assessmentRequest')
      .where('assessmentRequest.requestNumber LIKE :pattern', {
        pattern: `${baseNumber}-%`,
      })
      .orderBy('assessmentRequest.requestNumber', 'DESC')
      .setLock('pessimistic_write')
      .getOne();
  }

  //------------------------------
  async getRequestCartable(
    actions: Action[],
    member: Member,
    requestLastUpdatedAt?: Date,
    lastId?: string,
  ): Promise<[AssessmentRequest[], number]> {
    const actionIds = actions.map((action) => action.id);

    const stateTransitions = await this.stateTransitionRepository.findAll({
      where: { actionId: In(actionIds) },
      relations: {
        process: true,
        action: true,
        currentState: true,
        nextState: true,
      },
    });

    const stateTransitionIds = stateTransitions.map(
      (stateMachine) => stateMachine.currentStateId,
    );

    const qb = this.assessmentRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.state', 'state')
      .leftJoinAndSelect('request.environment', 'environment')
      .leftJoinAndSelect('request.asset', 'asset')
      .leftJoinAndSelect('request.assessmentLayers', 'assessmentLayers')
      .leftJoinAndSelect('assessmentLayers.assessmentType', 'assessmentType');

    qb.where('request.stateId IN (:...stateTransitionIds)', {
      stateTransitionIds,
    });

    const where: FindOptionsWhere<AssessmentRequest> = {};

    const hasReadAccess = actions.some(
      (action) =>
        action.name === ActionEnum.Read &&
        action.process?.name === ProcessEnum.AssessmentRequest,
    );

    if (!hasReadAccess) {
      const teamMemberIds =
        await this.groupMembershipRepository.getUserTeamMembers(member.id);
      if (teamMemberIds.length === 0) {
        return [[], 0];
      }

      qb.andWhere('request.applicantId IN (:...teamMemberIds)', {
        teamMemberIds,
      });
      where.applicantId = In(teamMemberIds);
    }

    // Cursor pagination: updatedAt + tie-breaker id
    if (requestLastUpdatedAt && lastId) {
      qb.andWhere(
        '(request.updatedAt < :updatedAt OR (request.updatedAt = :updatedAt AND request.id < :lastId))',
        {
          updatedAt: new Date(requestLastUpdatedAt),
          lastId: lastId,
        },
      );
    }

    // Ordering + limit
    qb.orderBy('request.updatedAt', 'DESC')
      .addOrderBy('request.id', 'DESC')
      .take(20);

    const requests = await qb.getMany();

    const totalRequests = await this.count({
      where: {
        stateId: In(stateTransitionIds),
        ...where,
      },
    });

    return [requests, totalRequests];
  }
}
