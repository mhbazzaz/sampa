import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { I18nService } from 'nestjs-i18n';
import { Action } from 'src/action/entities/action.entity';
import { AssetToAudit } from 'src/asset/entities/asset-to-audit.entity';
import { ActionEnum } from 'src/common/enums/action.enum';
import { CategoryEnum } from 'src/common/enums/category.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AbstractRepository } from 'src/database/abstract.repository';
import { GroupMembershipRepository } from 'src/group-membership/repositories/group-membership.repository';
import { Member } from 'src/member/entities/member.entity';
import { Role } from 'src/role/entities/role.entity';
import { StateTransitionRepository } from 'src/state-transition/repositories/state-transition.repository';
import { State } from 'src/states/entities/state.entity';
import {
  DataSource,
  DeepPartial,
  FindOptionsWhere,
  In,
  QueryRunner,
  Repository,
} from 'typeorm';
import { AssessmentReportFilterDto } from '../dto/input/assessment-report-filter.dto';
import { FindAllAssessmentQueryDto } from '../dto/input/find-all-assessment-request-query.dto';
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
    info: string;
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
        info: data.info,
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
      .leftJoinAndSelect('assessmentLayers.state', 'assessmentLayersState')
      .leftJoinAndSelect('assessmentLayers.assessmentType', 'assessmentType');

    if (stateTransitionIds.length > 0) {
      qb.where('request.stateId IN (:...stateTransitionIds)', {
        stateTransitionIds,
      });
    } else {
      return [[], 0];
    }

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

    if (requestLastUpdatedAt && lastId) {
      qb.andWhere(
        '(request.updatedAt < :updatedAt OR (request.updatedAt = :updatedAt AND request.id < :lastId))',
        {
          updatedAt: new Date(requestLastUpdatedAt),
          lastId: lastId,
        },
      );
    }

    if (
      actions.findIndex((action) => action.name == 'approved_assignSAM') !== -1
    ) {
      qb.orWhere('("assessmentLayersState"."name" = \'approved\')');
    }

    if (
      actions.findIndex(
        (action) => action.name == 'SAM_assigned_add_supervise',
      ) !== -1
    ) {
      qb.orWhere('("assessmentLayersState"."name" = \'SAM assigned\')');
    }

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
      }) !== -1;

    if (!hasReadAccess) {
      const isInternal = memberRoles.some(
        (role) => role.category === CategoryEnum.INTERNAL,
      );

      if (isInternal) {
        const isSupervisor = memberRoles.some((role) =>
          role.name.includes('supervisor'),
        );
        const isSAM = memberRoles.some((role) => role.name.includes('SAM'));

        if (isSAM) {
          query.andWhere(
            '(assessmentLayers_assessmentTeams.memberId = :memberId AND assessmentLayers_assessmentTeams.isSAM = true)',
            { memberId: member.id },
          );
        } else if (isSupervisor) {
          query.andWhere(
            '(assessmentLayers_assessmentTeams.memberId = :memberId AND assessmentLayers_assessmentTeams.isLead = true)',
            { memberId: member.id },
          );
        } else {
          query.andWhere(
            '(assessmentLayers_assessmentTeams.memberId = :memberId AND assessmentLayers_assessmentTeams.isLead = false)',
            { memberId: member.id },
          );
        }
      } else {
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
    }

    return query.getOne();
  }

  //------------------------------
  async getAssessmentReports(filters: AssessmentReportFilterDto) {
    let finalRequestStateId: string | undefined;

    if (filters.isRequestFinalized !== undefined) {
      const stateRepository =
        this.assessmentRequestRepository.manager.getRepository(State);

      const finalRequestState = await stateRepository
        .createQueryBuilder('state')
        .innerJoin('state.process', 'process')
        .where('process.name = :processName', {
          processName: ProcessEnum.AssessmentRequest,
        })
        .orderBy('state.order', 'DESC')
        .getOne();

      finalRequestStateId = finalRequestState?.id;
    }

    const requestSubQuery = this.assessmentRequestRepository
      .createQueryBuilder('request')
      .select('request.id')
      .leftJoin('request.assessmentLayers', 'layer')
      .leftJoin('layer.state', 'layerState')
      .leftJoin('request.asset', 'asset')
      .leftJoin('request.state', 'state');

    let hasRequestFilters = false;

    if (filters.startTimeFrom) {
      requestSubQuery.andWhere('request.createdAt >= :startTimeFrom', {
        startTimeFrom: new Date(filters.startTimeFrom),
      });
      hasRequestFilters = true;
    }

    if (filters.startTimeTo) {
      requestSubQuery.andWhere('request.createdAt <= :startTimeTo', {
        startTimeTo: new Date(filters.startTimeTo),
      });
      hasRequestFilters = true;
    }

    if (filters.lastActTimeFrom) {
      requestSubQuery.andWhere('request.updatedAt >= :lastActTimeFrom', {
        lastActTimeFrom: new Date(filters.lastActTimeFrom),
      });
      hasRequestFilters = true;
    }

    if (filters.lastActTimeTo) {
      requestSubQuery.andWhere('request.updatedAt <= :lastActTimeTo', {
        lastActTimeTo: new Date(filters.lastActTimeTo),
      });
      hasRequestFilters = true;
    }

    if (filters.requestStateIds?.length) {
      requestSubQuery.andWhere('request.stateId IN (:...requestStateIds)', {
        requestStateIds: filters.requestStateIds,
      });
      hasRequestFilters = true;
    }

    if (filters.requestSide) {
      requestSubQuery.andWhere('state.side = :requestSide', {
        requestSide: filters.requestSide,
      });

      hasRequestFilters = true;
    }

    if (filters.layerSide) {
      requestSubQuery.andWhere('layerState.side = :layerSide', {
        layerSide: filters.layerSide,
      });

      hasRequestFilters = true;
    }

    if (filters.isRequestFinalized !== undefined && finalRequestStateId) {
      requestSubQuery.andWhere(
        filters.isRequestFinalized
          ? 'request.stateId = :finalRequestStateId'
          : 'request.stateId != :finalRequestStateId',
        { finalRequestStateId },
      );

      hasRequestFilters = true;
    }

    if (filters.layerStateIds?.length) {
      requestSubQuery.andWhere('layer.stateId IN (:...layerStateIds)', {
        layerStateIds: filters.layerStateIds,
      });
      hasRequestFilters = true;
    }

    if (filters.assessmentTypeIds?.length) {
      requestSubQuery.andWhere(
        'layer.assessmentTypeId IN (:...assessmentTypeIds)',
        {
          assessmentTypeIds: filters.assessmentTypeIds,
        },
      );
      hasRequestFilters = true;
    }

    if (filters.applicantIds?.length) {
      requestSubQuery.andWhere('request.applicantId IN (:...applicantIds)', {
        applicantIds: filters.applicantIds,
      });
      hasRequestFilters = true;
    }

    const vulnerabilityConditions: string[] = [];
    const vulnerabilityParams: Record<string, any> = {};

    if (
      filters.hasCriticalVulnerabilities !== undefined &&
      filters.hasCriticalVulnerabilities !== null
    ) {
      vulnerabilityConditions.push(
        'layer.criticalVulnerabilitiesCount >= :criticalThreshold',
      );
      vulnerabilityParams.criticalThreshold =
        filters.hasCriticalVulnerabilities;
    }

    if (
      filters.hasHighVulnerabilities !== undefined &&
      filters.hasHighVulnerabilities !== null
    ) {
      vulnerabilityConditions.push(
        'layer.highVulnerabilitiesCount >= :highThreshold',
      );
      vulnerabilityParams.highThreshold = filters.hasHighVulnerabilities;
    }

    if (
      filters.hasMediumVulnerabilities !== undefined &&
      filters.hasMediumVulnerabilities !== null
    ) {
      vulnerabilityConditions.push(
        'layer.mediumVulnerabilitiesCount >= :mediumThreshold',
      );
      vulnerabilityParams.mediumThreshold = filters.hasMediumVulnerabilities;
    }

    if (
      filters.hasLowVulnerabilities !== undefined &&
      filters.hasLowVulnerabilities !== null
    ) {
      vulnerabilityConditions.push(
        'layer.lowVulnerabilitiesCount >= :lowThreshold',
      );
      vulnerabilityParams.lowThreshold = filters.hasLowVulnerabilities;
    }

    if (vulnerabilityConditions.length > 0) {
      requestSubQuery.andWhere(
        `(${vulnerabilityConditions.join(' OR ')})`,
        vulnerabilityParams,
      );
      hasRequestFilters = true;
    }

    const filteredRequests = hasRequestFilters
      ? await requestSubQuery.getRawMany()
      : [];

    const filteredRequestIds = filteredRequests.map(
      (req: any) => req.request_id,
    );

    const assetRepository =
      this.assessmentRequestRepository.manager.getRepository('AssetToAudit');

    const assetQuery = assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.assetType', 'assetType')
      .leftJoinAndSelect('asset.assessmentRequests', 'request')
      .leftJoinAndSelect('request.state', 'requestState')
      .leftJoinAndSelect('request.applicant', 'applicant')
      .leftJoinAndSelect('request.assessmentLayers', 'layer')
      .leftJoinAndSelect('layer.assessmentType', 'assessmentType')
      .leftJoinAndSelect('layer.state', 'layerState');

    if (filters.assetReferenceId) {
      assetQuery.andWhere('asset.referenceId = :assetReferenceId', {
        assetReferenceId: filters.assetReferenceId,
      });
    }

    if (filters.assetTitle) {
      assetQuery.andWhere('LOWER(asset.title) LIKE LOWER(:assetTitle)', {
        assetTitle: `%${filters.assetTitle}%`,
      });
    }

    if (filters.assetTypeId) {
      assetQuery.andWhere('asset.assetTypeId = :assetTypeId', {
        assetTypeId: filters.assetTypeId,
      });
    }

    if (hasRequestFilters && filteredRequestIds.length > 0) {
      assetQuery.andWhere('request.id IN (:...filteredRequestIds)', {
        filteredRequestIds,
      });
    } else if (hasRequestFilters && filteredRequestIds.length === 0) {
      return {
        data: [],
        total: 0,
      };
    }

    assetQuery
      .orderBy('asset.createdAt', 'DESC')
      .skip(filters.skip)
      .take(filters.take);

    const [data, total] = await assetQuery.getManyAndCount();

    const transformedData = data.map((asset: any) => {
      const requests = asset.assessmentRequests || [];

      const filteredAssetRequests =
        hasRequestFilters && filteredRequestIds.length > 0
          ? requests.filter((req: any) => filteredRequestIds.includes(req.id))
          : requests;

      const requestsWithTotals = filteredAssetRequests.map((request: any) => {
        const layers = request.assessmentLayers || [];

        let filteredLayers = layers;

        if (filters.assessmentTypeIds?.length) {
          filteredLayers = filteredLayers.filter((layer: any) =>
            filters.assessmentTypeIds?.includes(layer.assessmentTypeId),
          );
        }

        if (filters.layerStateIds?.length) {
          filteredLayers = filteredLayers.filter((layer: any) =>
            filters.layerStateIds?.includes(layer.stateId),
          );
        }

        const hasVulnerabilityFilters =
          filters.hasCriticalVulnerabilities != null ||
          filters.hasHighVulnerabilities != null ||
          filters.hasMediumVulnerabilities != null ||
          filters.hasLowVulnerabilities != null;

        if (hasVulnerabilityFilters) {
          filteredLayers = filteredLayers.filter((layer: any) => {
            const matches: boolean[] = [];

            if (filters.hasCriticalVulnerabilities != null) {
              matches.push(
                layer.criticalVulnerabilitiesCount >=
                  filters.hasCriticalVulnerabilities,
              );
            }

            if (filters.hasHighVulnerabilities != null) {
              matches.push(
                layer.highVulnerabilitiesCount >=
                  filters.hasHighVulnerabilities,
              );
            }

            if (filters.hasMediumVulnerabilities != null) {
              matches.push(
                layer.mediumVulnerabilitiesCount >=
                  filters.hasMediumVulnerabilities,
              );
            }

            if (filters.hasLowVulnerabilities != null) {
              matches.push(
                layer.lowVulnerabilitiesCount >= filters.hasLowVulnerabilities,
              );
            }

            return matches.some(Boolean);
          });
        }

        const totalCriticalVulnerabilities = filteredLayers.reduce(
          (sum: number, layer: any) =>
            sum + (layer.criticalVulnerabilitiesCount || 0),
          0,
        );

        const totalHighVulnerabilities = filteredLayers.reduce(
          (sum: number, layer: any) =>
            sum + (layer.highVulnerabilitiesCount || 0),
          0,
        );

        const totalMediumVulnerabilities = filteredLayers.reduce(
          (sum: number, layer: any) =>
            sum + (layer.mediumVulnerabilitiesCount || 0),
          0,
        );

        const totalLowVulnerabilities = filteredLayers.reduce(
          (sum: number, layer: any) =>
            sum + (layer.lowVulnerabilitiesCount || 0),
          0,
        );

        return {
          ...request,
          assessmentLayers: filteredLayers,
          totalCriticalVulnerabilities,
          totalHighVulnerabilities,
          totalMediumVulnerabilities,
          totalLowVulnerabilities,
        };
      });

      const assetTotalCritical = requestsWithTotals.reduce(
        (sum: number, req: any) =>
          sum + (req.totalCriticalVulnerabilities || 0),
        0,
      );

      const assetTotalHigh = requestsWithTotals.reduce(
        (sum: number, req: any) => sum + (req.totalHighVulnerabilities || 0),
        0,
      );

      const assetTotalMedium = requestsWithTotals.reduce(
        (sum: number, req: any) => sum + (req.totalMediumVulnerabilities || 0),
        0,
      );

      const assetTotalLow = requestsWithTotals.reduce(
        (sum: number, req: any) => sum + (req.totalLowVulnerabilities || 0),
        0,
      );

      return {
        ...asset,
        assessmentRequests: requestsWithTotals,
        totalCriticalVulnerabilities: assetTotalCritical,
        totalHighVulnerabilities: assetTotalHigh,
        totalMediumVulnerabilities: assetTotalMedium,
        totalLowVulnerabilities: assetTotalLow,
      };
    });

    return {
      data: transformedData,
      total,
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

  //------------------------------
  async getAccessibleRequestIds(
    member: Member,
    memberRoles: Role[],
    actions: Action[],
  ): Promise<string[]> {
    const hasReadAccess = actions.some(
      (action) =>
        action.name === ActionEnum.Read &&
        action.process?.name === ProcessEnum.AssessmentRequest,
    );

    const qb = this.assessmentRequestRepository
      .createQueryBuilder('assessmentRequest')
      .select('assessmentRequest.id', 'id')
      .where('assessmentRequest.deletedAt IS NULL');

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
            '(assessmentRequest.applicantManagerId = :memberId OR assessmentRequest.applicantId IN (:...teams))',
            { memberId: member.id, teams },
          );
        } else {
          qb.andWhere('assessmentRequest.applicantManagerId = :memberId', {
            memberId: member.id,
          });
        }
      } else if (teams.length > 0) {
        qb.andWhere('assessmentRequest.applicantId IN (:...teams)', {
          teams,
        });
      } else {
        return [];
      }
    }

    const rows = await qb.getRawMany<{ id: string }>();
    return rows.map((row) => row.id);
  }
}
