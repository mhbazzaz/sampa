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
import { Role } from 'src/role/entities/role.entity';
import { StateTransitionRepository } from 'src/state-transition/repositories/state-transition.repository';
import {
  DataSource,
  DeepPartial,
  FindOptionsWhere,
  In,
  QueryRunner,
  Repository,
} from 'typeorm';
import { FindAllAssessmentQueryDto } from '../dto/input/find-all-assessment-request-query.dto';
import { AssessmentLayer } from '../entities/assessment-layer.entity';
import { AssessmentRequest } from '../entities/assessment-request.entity';
import { AssessmentReportFilterDto } from '../dto/input/assessment-report-filter.dto';

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
        'assessmentLayers',
        'assessmentLayers.assessmentType',
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
    memberRoles: Role[],
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
      const teams = await this.groupMembershipRepository.getUserTeamMembers(
        member.id,
      );

      const isApplicantManager = memberRoles.some(
        (role) => role.name === 'applicant manager',
      );

      if (isApplicantManager) {
        if (teams.length > 0) {
          qb.andWhere(
            '(request.applicantManagerId = :memberId OR request.applicantId IN (:...teams))',
            { memberId: member.id, teams },
          );
        } else {
          qb.andWhere('request.applicantManagerId = :memberId', {
            memberId: member.id,
          });
        }
      } else {
        if (teams.length > 0) {
          qb.andWhere('request.applicantId IN (:...teams)', { teams });
        } else {
          return [[], 0];
        }
      }
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

  //------------------------------
  async getRequestIfUserHasAccessToChangeIt(
    requestId: string,
    member: Member,
    memberRoles: Role[],
    relations: string[] = [],
  ) {
    const query = this.assessmentRequestRepository
      .createQueryBuilder('request')
      .where('request.id = :requestId', { requestId });

    const joined = new Set<string>();

    for (const relation of relations) {
      const parts = relation.split('.');
      let parentAlias = 'request';
      let currentPath = '';

      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}.${part}` : part;

        if (!joined.has(currentPath)) {
          const alias = currentPath.replace(/\./g, '_');
          query.leftJoinAndSelect(`${parentAlias}.${part}`, alias);
          joined.add(currentPath);
        }

        parentAlias = currentPath.replace(/\./g, '_');
      }
    }

    const teams = await this.groupMembershipRepository.getUserTeamMembers(
      member.id,
    );

    const isApplicantManager = memberRoles.some(
      (role) => role.name === 'applicant manager',
    );

    if (isApplicantManager) {
      if (teams.length > 0) {
        query.andWhere(
          '(request.applicantManagerId = :memberId OR request.applicantId IN (:...teams))',
          { memberId: member.id, teams },
        );
      } else {
        query.andWhere('request.applicantManagerId = :memberId', {
          memberId: member.id,
        });
      }
    } else {
      if (teams.length > 0) {
        query.andWhere('request.applicantId IN (:...teams)', { teams });
      } else {
        return null;
      }
    }

    return query.getOne();
  }

  //------------------------------
  async getRequestWhetherUserCanReadItOrItIsUsers(
    requestId: string,
    member: Member,
    memberRoles: Role[],
    actions: Action[],
    relations: string[] = [],
  ) {
    const query = this.assessmentRequestRepository
      .createQueryBuilder('request')
      .where('request.id = :requestId', { requestId });

    const joined = new Set<string>();

    for (const relation of relations) {
      const parts = relation.split('.');
      let parentAlias = 'request';
      let currentPath = '';

      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}.${part}` : part;

        if (!joined.has(currentPath)) {
          const alias = currentPath.replace(/\./g, '_');
          query.leftJoinAndSelect(`${parentAlias}.${part}`, alias);
          joined.add(currentPath);
        }

        parentAlias = currentPath.replace(/\./g, '_');
      }
    }

    const hasReadAccess =
      actions.findIndex((action) => {
        return (
          action.name === ActionEnum.Read &&
          action.process?.name === ProcessEnum.AssessmentRequest
        );
      }) === -1;

    if (!hasReadAccess) {
      const teams = await this.groupMembershipRepository.getUserTeamMembers(
        member.id,
      );

      const isApplicantManager = memberRoles.some(
        (role) => role.name === 'applicant manager',
      );

      if (isApplicantManager) {
        if (teams.length > 0) {
          query.andWhere(
            '(request.applicantManagerId = :memberId OR request.applicantId IN (:...teams))',
            { memberId: member.id, teams },
          );
        } else {
          query.andWhere('request.applicantManagerId = :memberId', {
            memberId: member.id,
          });
        }
      } else {
        if (teams.length > 0) {
          query.andWhere('request.applicantId IN (:...teams)', { teams });
        } else {
          return null;
        }
      }
    }

    return query.getOne();
  }

  //------------------------------
  async getAssessmentReports(filters: AssessmentReportFilterDto) {
    const query = this.assessmentRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.asset', 'asset')
      .leftJoinAndSelect('request.state', 'state')
      .leftJoinAndSelect('request.assessmentLayers', 'layer');

    if (filters.startTimeFrom || filters.startTimeTo) {
      const from = filters.startTimeFrom
        ? new Date(filters.startTimeFrom)
        : null;
      const to = filters.startTimeTo ? new Date(filters.startTimeTo) : null;
      query.andWhere('request.createdAt BETWEEN :from AND :to', { from, to });
    }

    if (filters.lastActTimeFrom || filters.lastActTimeTo) {
      const from = filters.lastActTimeFrom
        ? new Date(filters.lastActTimeFrom)
        : null;
      const to = filters.lastActTimeTo ? new Date(filters.lastActTimeTo) : null;
      query.andWhere('request.updatedAt BETWEEN :from AND :to', { from, to });
    }

    if (filters.layerStatuses && filters.layerStatuses.length > 0) {
      query.andWhere('layer.stateId IN (:...layerStatuses)', {
        layerStatuses: filters.layerStatuses,
      });
      query.groupBy('request.id');
    } else {
      query.groupBy('request.id');
    }

    if (filters.assetReferenceId) {
      query.andWhere('asset.referenceId = :assetReferenceId', {
        assetReferenceId: filters.assetReferenceId,
      });
    }

    if (filters.assetTitle) {
      query.andWhere('LOWER(asset.title) LIKE LOWER(:assetTitle)', {
        assetTitle: `%${filters.assetTitle}%`,
      });
    }

    if (filters.assetTypeId) {
      query.andWhere('asset.assetTypeId = :assetTypeId', {
        assetTypeId: filters.assetTypeId,
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    query.orderBy('request.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  //------------------------------
  async getUsersRequests(
    query: FindAllAssessmentQueryDto,
    member: Member,
    memberRoles: Role[],
    actions: Action[],
  ) {
    const hasReadAccess = actions.some(
      (action) =>
        action.name === ActionEnum.Read &&
        action.process?.name === ProcessEnum.AssessmentRequest,
    );

    let queryBuilder = this.assessmentRequestRepository
      .createQueryBuilder('assessmentRequest')
      .leftJoinAndSelect('assessmentRequest.state', 'state')
      .leftJoinAndSelect('assessmentRequest.environment', 'environment')
      .leftJoinAndSelect('assessmentRequest.asset', 'asset');

    if (!hasReadAccess) {
      const teams = await this.groupMembershipRepository.getUserTeamMembers(
        member.id,
      );

      const isApplicantManager = memberRoles.some(
        (role) => role.name === 'applicant manager',
      );

      if (isApplicantManager) {
        if (teams.length > 0) {
          queryBuilder.andWhere(
            '(assessmentRequest.applicantManagerId = :memberId OR assessmentRequest.applicantId IN (:...teams))',
            { memberId: member.id, teams },
          );
        } else {
          queryBuilder.andWhere(
            'assessmentRequest.applicantManagerId = :memberId',
            {
              memberId: member.id,
            },
          );
        }
      } else {
        if (teams.length > 0) {
          queryBuilder.andWhere(
            'assessmentRequest.applicantId IN (:...teams)',
            {
              teams,
            },
          );
        } else {
          return [[], 0];
        }
      }
    }

    if (query.requestNumber) {
      queryBuilder = queryBuilder.andWhere(
        'assessmentRequest.requestNumber LIKE :requestNumber',
        {
          requestNumber: `%${query.requestNumber}%`,
        },
      );
    }

    if (query.assetName) {
      queryBuilder = queryBuilder.andWhere('asset.title ILike :assetName', {
        assetName: `%${query.assetName}%`,
      });
    }

    if (query.stateId) {
      queryBuilder = queryBuilder.andWhere(
        'assessmentRequest.stateId = :stateId',
        {
          stateId: query.stateId,
        },
      );
    }

    if (query.environmentId) {
      queryBuilder = queryBuilder.andWhere(
        'assessmentRequest.environmentId = :environmentId',
        {
          environmentId: query.environmentId,
        },
      );
    }

    const createdAtStart = query.createdAtStart
      ? new Date(query.createdAtStart)
      : null;
    const createdAtEnd = query.createdAtEnd
      ? new Date(query.createdAtEnd)
      : null;

    if (createdAtStart && createdAtEnd) {
      queryBuilder = queryBuilder.andWhere(
        'assessmentRequest.createdAt BETWEEN :createdAtStart AND :createdAtEnd',
        {
          createdAtStart,
          createdAtEnd,
        },
      );
    } else if (createdAtStart) {
      queryBuilder = queryBuilder.andWhere(
        'assessmentRequest.createdAt >= :createdAtStart',
        {
          createdAtStart,
        },
      );
    } else if (createdAtEnd) {
      queryBuilder = queryBuilder.andWhere(
        'assessmentRequest.createdAt <= :createdAtEnd',
        {
          createdAtEnd,
        },
      );
    }

    const updatedAtStart = query.updatedAtStart
      ? new Date(query.updatedAtStart)
      : null;
    const updatedAtEnd = query.updatedAtEnd
      ? new Date(query.updatedAtEnd)
      : null;

    if (updatedAtStart && updatedAtEnd) {
      queryBuilder = queryBuilder.andWhere(
        'assessmentRequest.updatedAt BETWEEN :updatedAtStart AND :updatedAtEnd',
        {
          updatedAtStart,
          updatedAtEnd,
        },
      );
    } else if (updatedAtStart) {
      queryBuilder = queryBuilder.andWhere(
        'assessmentRequest.updatedAt >= :updatedAtStart',
        {
          updatedAtStart,
        },
      );
    } else if (updatedAtEnd) {
      queryBuilder = queryBuilder.andWhere(
        'assessmentRequest.updatedAt <= :updatedAtEnd',
        {
          updatedAtEnd,
        },
      );
    }

    queryBuilder = queryBuilder.orderBy('assessmentRequest.createdAt', 'DESC');
    queryBuilder = queryBuilder.skip(query.skip).take(query.take);

    return queryBuilder.getManyAndCount();
  }
}
