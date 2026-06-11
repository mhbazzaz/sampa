import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { ActionLogBufferService } from 'src/action-log/services/action-log-buffer.service';
import { Action } from 'src/action/entities/action.entity';
import { ActionRepository } from 'src/action/repositories/action.repository';
import { ActionLogStatusEnum } from 'src/common/enums/action-log.enum';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AbstractRepository } from 'src/database/abstract.repository';
import { GroupMembershipRepository } from 'src/group-membership/repositories/group-membership.repository';
import { Member } from 'src/member/entities/member.entity';
import { ProcessRepository } from 'src/process/repositories/process.repository';
import { Role } from 'src/role/entities/role.entity';
import { StateTransitionRepository } from 'src/state-transition/repositories/state-transition.repository';
import { StateTransitionService } from 'src/state-transition/services/state-transition.service';
import { State } from 'src/states/entities/state.entity';
import { StatesRepository } from 'src/states/repositories/state.repository';
import {
  DataSource,
  DeepPartial,
  FindOptionsWhere,
  In,
  Not,
  Repository,
} from 'typeorm';
import { FindAllAssessmentLayersQueryDto } from '../dto/input/find-all-assessment-layers-query.dto';
import { UpdateAssessmentLayerAuditorsDto } from '../dto/input/update-assessment-layer-add-auditors.dto';
import { UpdateAssessmentLayerAddSupervisorsDto } from '../dto/input/update-assessment-layer-add-supervisors.dto';
import { AssessmentLayer } from '../entities/assessment-layer.entity';
import { AssessmentRequest } from '../entities/assessment-request.entity';
import { AssessmentTeamRepository } from './assessment-team.repository';

@Injectable()
export class AssessmentLayerRepository extends AbstractRepository<AssessmentLayer> {
  constructor(
    @InjectRepository(AssessmentLayer)
    private assessmentLayerRepository: Repository<AssessmentLayer>,
    private assessmentTeamRepository: AssessmentTeamRepository,
    private stateTransitionRepository: StateTransitionRepository,
    private groupMembershipRepository: GroupMembershipRepository,
    private statesRepository: StatesRepository,
    private processRepository: ProcessRepository,
    private actionRepository: ActionRepository,
    private stateTransitionService: StateTransitionService,
    private readonly dataSource: DataSource,
    private readonly i18nService: I18nService,
    private readonly actionLogBufferService: ActionLogBufferService,
  ) {
    super(assessmentLayerRepository, i18nService);
  }

  //------------------------------
  async updateManyStateByAssessmentRequestId(
    requestId: string,
    data: DeepPartial<AssessmentLayer>,
  ) {
    this.assessmentLayerRepository.update(
      { assessmentRequestId: requestId },
      data,
    );
  }

  //------------------------------
  async addSupervisor(
    data: UpdateAssessmentLayerAddSupervisorsDto,
    member: Member,
    memberRoles: Role[],
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < data.dataList.length; i++) {
        const element = data.dataList[i];

        const layer = await this.findOne({
          where: { id: element.layerId },
          relations: { assessmentRequest: true },
        });

        if (!layer) {
          throw new BadRequestException(
            this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
              args: { property: 'layer' },
            }),
          );
        }

        const layerCurrentStateId = layer.stateId;

        await this.assessmentTeamRepository.findAndDeleteTransactionable(
          {
            assessmentLayerId: element.layerId,
            memberId: Not(In(element.supervisorIds)),
            isLead: true,
            isMember: false,
          },
          queryRunner,
        );

        for (let i = 0; i < element.supervisorIds.length; i++) {
          const supervisorId = element.supervisorIds[i];
          const groupMembership =
            await this.assessmentTeamRepository.findOneTransactionable(
              {
                where: {
                  memberId: supervisorId,
                  assessmentLayerId: element.layerId,
                  isLead: true,
                  isMember: false,
                },
              },
              queryRunner,
            );

          if (groupMembership) {
            continue;
          }

          await this.assessmentTeamRepository.saveTransactionable(
            {
              assessmentLayerId: element.layerId,
              memberId: supervisorId,
              isLead: true,
              isMember: false,
            },
            queryRunner,
          );
        }

        const process = await this.processRepository.findOne({
          where: {
            name: ProcessEnum.AssessmentLayer,
          },
        });
        if (!process) {
          throw new InternalServerErrorException(
            `process not found: ${ProcessEnum.AssessmentLayer}`,
          );
        }

        const action = await this.actionRepository.findOne({
          where: {
            name: element.action,
            processId: process.id,
          },
        });
        if (!action) {
          throw new InternalServerErrorException(
            `action not found: name: ${element.action} _ processId: ${process.id}`,
          );
        }

        const stateTransition = await this.stateTransitionService.getNextStatus(
          {
            processId: process.id,
            actionId: action.id,
            currentStateId: layer.stateId,
          },
        );

        await queryRunner.manager.update(
          AssessmentLayer,
          {
            id: layer.id,
          },
          { stateId: stateTransition.id },
        );

        // if (Array.isArray(layer.assessmentRequest?.assessmentLayers)) {
        //   let allLayersSupervisorAdded = true;
        //   for (
        //     let i = 0;
        //     i < layer.assessmentRequest.assessmentLayers.length;
        //     i++
        //   ) {
        //     const element = layer.assessmentRequest.assessmentLayers[i];

        //     if (element.stateId !== stateTransition.id) {
        //       allLayersSupervisorAdded = false;
        //     }
        //   }

        //   if (allLayersSupervisorAdded) {
        //   }
        // }

        await this.actionLogBufferService.flushToActionLog(
          {
            assessmentRequestId: layer.assessmentRequestId,
            assessmentLayerId: layer.id,
          },
          {
            userId: member.id,
            roleIds: memberRoles.map((r) => r.id),
            action: element.action as ActionEnum,
            status: ActionLogStatusEnum.SUCCESS,
            assessmentRequestCurrentStateId: layer.assessmentRequest?.stateId ?? null,
            assessmentRequestNextStateId: layer.assessmentRequest?.stateId ?? null,
            assessmentLayerCurrentStateId: layerCurrentStateId,
            assessmentLayerNextStateId: stateTransition.id,
          },
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return true;
  }

  //------------------------------
  async addAuditors(
    data: UpdateAssessmentLayerAuditorsDto,
    member: Member,
    memberRoles: Role[],
  ): Promise<boolean> {
    const actions = await this.actionRepository.findAll({
      select: { id: true, name: true, process: { name: true } },
      relations: ['process'],
      where: { roles: { id: In(memberRoles.map((role) => role.id)) } },
    });

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      const layers = await this.findAll({
        where: {
          assessmentRequest: {
            assessmentLayers: { id: data.dataList[0].layerId },
          },
        },
        relations: { assessmentRequest: true },
      });

      let stateTransition: State | undefined;

      for (let i = 0; i < data.dataList.length; i++) {
        const element = data.dataList[i];

        if (
          actions.findIndex((action) => {
            return (
              action.name === ActionEnum.SupervisedAssignAllTeamsAuditors &&
              action.process?.name === ProcessEnum.AssessmentLayer
            );
          }) === -1
        ) {
          const assessmentTeams = await this.assessmentTeamRepository.findAll({
            where: { isLead: true, memberId: member.id },
          });

          if (
            assessmentTeams.findIndex(
              (assessmentTeam) =>
                assessmentTeam.assessmentLayerId === element.layerId,
            ) === -1
          ) {
            throw new BadRequestException(
              this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
                args: { property: 'layer' },
              }),
            );
          }
        }

        const layer = layers.find((layer) => layer.id === element.layerId);

        if (!layer) {
          throw new BadRequestException(
            this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
              args: { property: 'layer' },
            }),
          );
        }
        const layerCurrentStateId = layer.stateId;

        await this.assessmentTeamRepository.findAndDeleteTransactionable(
          {
            assessmentLayerId: element.layerId,
            memberId: Not(In(element.auditorIds)),
            isLead: false,
            isMember: true,
          },
          queryRunner,
        );

        for (let i = 0; i < element.auditorIds.length; i++) {
          const auditorId = element.auditorIds[i];
          const groupMembership =
            await this.assessmentTeamRepository.findOneTransactionable(
              {
                where: {
                  memberId: auditorId,
                  assessmentLayerId: element.layerId,
                  isLead: false,
                  isMember: true,
                },
              },
              queryRunner,
            );

          if (groupMembership) {
            continue;
          }

          await this.assessmentTeamRepository.saveTransactionable(
            {
              assessmentLayerId: element.layerId,
              memberId: auditorId,
              isLead: false,
              isMember: true,
            },
            queryRunner,
          );
        }

        const process = await this.processRepository.findOne({
          where: {
            name: ProcessEnum.AssessmentLayer,
          },
        });
        if (!process) {
          throw new InternalServerErrorException(
            `process not found: ${ProcessEnum.AssessmentLayer}`,
          );
        }

        const action = await this.actionRepository.findOne({
          where: {
            name: ActionEnum.SupervisedAssignAllTeamsAuditors,
            processId: process.id,
          },
        });

        if (!action) {
          throw new InternalServerErrorException(
            `action not found: name: ${ActionEnum.SupervisedAssignAllTeamsAuditors} _ processId: ${process.id}`,
          );
        }

        if (!stateTransition) {
          stateTransition = await this.stateTransitionService.getNextStatus({
            processId: process.id,
            actionId: action.id,
            currentStateId: layer.stateId,
          });
        }

        layer.stateId = stateTransition.id;

        await this.actionLogBufferService.flushToActionLog(
          {
            assessmentRequestId: layer.assessmentRequestId,
            assessmentLayerId: layer.id,
          },
          {
            userId: member.id,
            roleIds: memberRoles.map((r) => r.id),
            action: ActionEnum.SupervisedAssignAllTeamsAuditors,
            status: ActionLogStatusEnum.SUCCESS,
            assessmentRequestCurrentStateId: layer.assessmentRequest?.stateId ?? null,
            assessmentRequestNextStateId: layer.assessmentRequest?.stateId ?? null,
            assessmentLayerCurrentStateId: layerCurrentStateId,
            assessmentLayerNextStateId: stateTransition.id,
          },
          queryRunner,
        );
      }

      // const otherLayers = await this.assessmentLayerRepository.find({
      //   where: {
      //     assessmentRequestId: layer.assessmentRequestId,
      //     id: Not(layer.id),
      //   },
      //   relations: { state: true },
      // });

      let allUpdated = true;
      // console.log(otherLayers);

      for (let index = 0; index < layers.length; index++) {
        const layer = layers[index];

        if (stateTransition && layer.stateId !== stateTransition.id) {
          allUpdated = false;
        }
      }

      console.log(allUpdated);

      if (allUpdated) {
        const stateLayer = await this.statesRepository.findOne({
          where: {
            name: 'pendingLayerSpecs',
            process: { name: 'assessment layer' },
          },
        });

        if (!stateLayer) {
          throw new InternalServerErrorException(
            `state not found: name: pendingLayerSpecs _ process: assessment layer`,
          );
        }

        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];

          layer.stateId = stateLayer.id;
        }

        const stateRequest = await this.statesRepository.findOne({
          where: {
            name: 'awaitingSpecs',
            process: { name: 'assessment request' },
          },
        });
        if (!stateRequest) {
          throw new InternalServerErrorException(
            `state not found: name: awaitingSpecs _ process: assessment request`,
          );
        }
        await queryRunner.manager.update(
          AssessmentRequest,
          {
            id: layers[0].assessmentRequestId,
          },
          { stateId: stateRequest.id },
        );
      }

      queryRunner.manager.save(AssessmentLayer, layers);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return true;
  }

  async getLayerCartable(
    actions: Action[],
    member: Member,
    layerLastUpdatedAt?: Date,
    lastId?: string,
  ): Promise<[AssessmentLayer[], number]> {
    const actionIds = actions
      .filter((a) => {
        return (
          a.name !== ActionEnum.SupervisedAssignAllTeamsAuditors &&
          a.name !== ActionEnum.ApprovedAssignSupervisor
        );
      })
      .map((a) => a.id);

    if (actionIds.length === 0) {
      return [[], 0];
    }

    const stateTransitions = await this.stateTransitionRepository.findAll({
      where: { actionId: In(actionIds) },
      select: { currentStateId: true },
    });

    const allowedStateIds = stateTransitions.map((st) => st.currentStateId);

    if (allowedStateIds.length === 0) {
      return [[], 0];
    }

    const qb = this.assessmentLayerRepository
      .createQueryBuilder('layer')
      .leftJoinAndSelect('layer.state', 'state')
      .leftJoinAndSelect('layer.assessmentType', 'assessmentType')
      .leftJoinAndSelect('layer.assessmentTeams', 'assessmentTeams')
      .leftJoinAndSelect('layer.assessmentRequest', 'assessmentRequest')
      .leftJoinAndSelect('assessmentRequest.state', 'requestState')
      .leftJoinAndSelect('assessmentRequest.asset', 'asset')
      .leftJoinAndSelect('assessmentRequest.environment', 'environment');

    qb.where('layer.stateId IN (:...allowedStateIds)', {
      allowedStateIds: [...new Set(allowedStateIds)],
    });

    const where: FindOptionsWhere<AssessmentLayer> = {};

    const hasReadAccess = actions.some(
      (action) =>
        action.name === ActionEnum.Read &&
        action.process?.name === ProcessEnum.AssessmentLayer,
    );

    if (!hasReadAccess) {
      qb.andWhere(
        '(assessmentTeams.memberId = :memberId OR assessmentRequest.applicantId = :memberId OR assessmentRequest.applicantManagerId = :memberId)',
        {
          memberId: member.id,
        },
      );
      where.assessmentTeams = { memberId: member.id };
    }

    if (layerLastUpdatedAt && lastId) {
      qb.andWhere(
        '(layer.updatedAt < :updatedAt OR (layer.updatedAt = :updatedAt AND layer.id < :lastId))',
        {
          updatedAt: new Date(layerLastUpdatedAt),
          lastId: lastId,
        },
      );
    }

    qb.orderBy('layer.updatedAt', 'DESC')
      .addOrderBy('layer.id', 'DESC')
      .take(20);

    const totalRequests = await this.count({
      where: {
        stateId: In(allowedStateIds),
        ...where,
      },
    });

    return [await qb.getMany(), totalRequests];
  }

  async getOneAssessmentLayerQueryBuilder(
    layerId: string,
    memberRoles: Role[],
    memberId: string,
  ) {
    const actions = await this.actionRepository.findAll({
      select: { id: true, name: true, process: { name: true } },
      relations: ['process'],
      where: {
        roles: { id: In(memberRoles.map((memberRole) => memberRole.id)) },
      },
    });

    const hasReadAccess = actions.some(
      (action) =>
        action.name === ActionEnum.Read &&
        action.process?.name === ProcessEnum.AssessmentLayer,
    );

    const query = this.assessmentLayerRepository
      .createQueryBuilder('layer')
      .leftJoinAndSelect('layer.assessmentRequest', 'request')
      .leftJoinAndSelect('request.asset', 'asset')
      .leftJoinAndSelect('request.requestSpecContents', 'requestSpecContents')
      .leftJoinAndSelect('request.testcaseContents', 'testcaseContents')
      .leftJoinAndSelect(
        'testcaseContents.testcaseRemediates',
        'testcaseRemediates',
      )
      .leftJoinAndSelect('testcaseContents.testcaseItem', 'testcaseItem')
      .leftJoinAndSelect('layer.assessmentType', 'assessmentType')
      .leftJoinAndSelect('layer.state', 'state')
      .leftJoinAndSelect('layer.assessmentTeams', 'assessmentTeams')
      .leftJoinAndSelect('assessmentTeams.member', 'member')
      .where('layer.id = :layerId', { layerId });

    if (!hasReadAccess) {
      const teams =
        await this.groupMembershipRepository.getUserTeamMembers(memberId);

      const isApplicantManager = memberRoles.some(
        (role) => role.name === 'applicant manager',
      );

      if (isApplicantManager) {
        if (teams.length > 0) {
          query.andWhere(
            '(request.applicantManagerId = :memberId OR request.applicantId IN (:...teams))',
            { memberId, teams },
          );
        } else {
          query.andWhere('request.applicantManagerId = :memberId', {
            memberId,
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

  async getUsersLayers(
    query: FindAllAssessmentLayersQueryDto,
    member: Member,
    memberRoles: Role[],
    actions: Action[],
  ) {
    const hasReadAccess = actions.some(
      (action) =>
        action.name === ActionEnum.Read &&
        action.process?.name === ProcessEnum.AssessmentRequest,
    );

    let queryBuilder = this.assessmentLayerRepository
      .createQueryBuilder('assessmentLayer')
      .leftJoinAndSelect(
        'assessmentLayer.assessmentRequest',
        'assessmentRequest',
      )
      .leftJoinAndSelect('assessmentLayer.state', 'state')
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
        'assessmentLayer.stateId = :stateId',
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
