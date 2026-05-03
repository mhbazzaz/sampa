import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ActionLogRepository } from 'src/action-log/repositories/action-log.repository';
import { ActionRepository } from 'src/action/repositories/action.repository';
import { AssetService } from 'src/asset/services/asset-to-audit.service';
import { ActionLogStatusEnum } from 'src/common/enums/action-log.enum';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { ContentStatus } from 'src/common/enums/test-case-content-status.enum';
import { userMapperLevel2 } from 'src/common/helpers/user-mapper-level-2';
import { GetCartableDto } from 'src/common/pagination-dto/get-cartable.dto';
import { Environment } from 'src/environment/entities/environment.entity';
import { EnvironmentRepository } from 'src/environment/repositories/environment.repository';
import { EnvironmentService } from 'src/environment/services/environment.service';
import { GroupMembershipRepository } from 'src/group-membership/repositories/group-membership.repository';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
import { ProcessRepository } from 'src/process/repositories/process.repository';
import { RequestComment } from 'src/request-comment/entities/request-comment.entity';
import { RequestCommentRepository } from 'src/request-comment/repositories/request-comment.repository';
import { Role } from 'src/role/entities/role.entity';
import { RequestSpecItemRepository } from 'src/spec/repositories/request-spec-item.repository';
import { StateTransitionRepository } from 'src/state-transition/repositories/state-transition.repository';
import { StateTransitionService } from 'src/state-transition/services/state-transition.service';
import { State } from 'src/states/entities/state.entity';
import { StatesRepository } from 'src/states/repositories/state.repository';
import { StatesService } from 'src/states/services/states.service';
import {
  Between,
  DataSource,
  DeepPartial,
  FindOneOptions,
  FindOptionsWhere,
  ILike,
  In,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  QueryRunner,
} from 'typeorm';
import { CreateAssessmentRequestDto } from '../dto/input/create-assessment-request.dto';
import { FindAllAssessmentQueryDto } from '../dto/input/find-all-assessment-request-query.dto';
import { RequestClosureDto } from '../dto/input/request-closure.dto';
import { UpdateRequestStatusByActionDto } from '../dto/input/update-request-status-by-action.dto';
import { UpdateRequestDto } from '../dto/input/update-request.dto';
import { AssessmentLayer } from '../entities/assessment-layer.entity';
import { AssessmentRequest } from '../entities/assessment-request.entity';
import { AssessmentTeam } from '../entities/assessment-team.entity';
import { AssessmentLayerRepository } from '../repositories/assessment-layer.repository';
import { AssessmentRequestRepository } from '../repositories/assessment-request.repository';
import { AssessmentTypeRepository } from '../repositories/assessment-type.repository';

@Injectable()
export class AssessmentRequestService {
  constructor(
    private readonly assessmentRequestRepository: AssessmentRequestRepository,
    private readonly environmentRepository: EnvironmentRepository,
    private readonly environmentService: EnvironmentService,
    private readonly assetService: AssetService,
    private readonly assessmentTypeRepository: AssessmentTypeRepository,
    private readonly assessmentLayerRepository: AssessmentLayerRepository,
    private readonly actionRepository: ActionRepository,
    private readonly stateTransitionRepository: StateTransitionRepository,
    private readonly processRepository: ProcessRepository,
    private readonly groupMembershipRepository: GroupMembershipRepository,
    private readonly memberRepository: MemberRepository,
    private readonly statesRepository: StatesRepository,
    private readonly stateTransitionService: StateTransitionService,
    private readonly actionLogRepository: ActionLogRepository,
    private readonly requestSpecItemRepository: RequestSpecItemRepository,
    private readonly requestCommentRepository: RequestCommentRepository,
    private readonly stateService: StatesService,
    private readonly i18nService: I18nService,
    private readonly dataSource: DataSource,
  ) {}

  //------------------------------
  async create(
    data: DeepPartial<AssessmentRequest>,
  ): Promise<AssessmentRequest> {
    return this.assessmentRequestRepository.save(data);
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<AssessmentRequest>,
  ): Promise<AssessmentRequest | null> {
    return this.assessmentRequestRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.assessmentRequestRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<AssessmentRequest>,
    updateAssessmentRequest: Partial<AssessmentRequest>,
  ) {
    return this.assessmentRequestRepository.update(
      data,
      updateAssessmentRequest,
    );
  }

  //------------------------------
  async remove(data: FindOptionsWhere<AssessmentRequest>) {
    return this.assessmentRequestRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.assessmentRequestRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async createAssessmentRequest(
    dto: CreateAssessmentRequestDto,
    member: Member,
    memberRoles: Role[],
  ) {
    const { assetReferenceId, assessmentTypeIds, assetToAuditBaseline } = dto;

    const environment = await this.environmentRepository.findOne({
      where: { id: dto.environmentId },
    });
    if (!environment) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'environment' },
        }),
      );
    }

    const assetToAudit = await this.assetService.findOne({
      where: { referenceId: assetReferenceId },
      relations: { assetType: true },
    });

    if (!assetToAudit) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'assetToAudit' },
        }),
      );
    }

    if (!assetToAudit.assetType) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR__NOT_FOUND_ASSET_TYPE_FOR_ASSET'),
      );
    }

    const assessmentTypes = await Promise.all(
      assessmentTypeIds.map(async (id) => {
        const type = await this.assessmentTypeRepository.findOne({
          where: { id },
        });
        if (!type) {
          throw new BadRequestException(
            this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
              args: { property: 'AssessmentType' },
            }),
          );
        }
        return type;
      }),
    );

    const requestData = {
      asset: assetToAudit,
    };

    const state = await this.statesRepository.findOne({
      where: {
        name: dto.type === 'draft' ? 'draft' : 'submitted',
        process: { name: ProcessEnum.AssessmentRequest },
      },
    });
    if (!state) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'state' },
        }),
      );
    }

    let ciso: Member;
    try {
      ciso = await this.memberRepository.findCiso();
    } catch {
      throw new InternalServerErrorException(
        this.i18nService.t('messages.NO_CISO'),
      );
    }

    const applicantManager = await this.groupMembershipRepository.findOne({
      where: {
        isLead: true,
        group: { assetId: requestData.asset.id },
      },
    });

    if (!applicantManager) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'applicantManager' },
        }),
      );
    }

    const createdRequest =
      await this.assessmentRequestRepository.createAssessmentRequest({
        ...requestData,
        environmentId: environment.id,
        stateId: state.id,
        applicantId: member.id,
        applicantManagerId: applicantManager.userId,
        assetToAuditBaseline: assetToAuditBaseline,
        cisoId: ciso.id,
        code: assetToAudit.assetType.code,
      });

    const createdLayers = await Promise.all(
      assessmentTypes.map(async (type) => {
        const state = await this.statesRepository.findOne({
          where: {
            name: 'initiated',
            process: { name: ProcessEnum.AssessmentLayer },
          },
        });
        if (!state) {
          throw new BadRequestException(
            this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
              args: { property: 'state' },
            }),
          );
        }

        const layerData = {
          stateId: state.id,
          assessmentRequest: createdRequest,
          assessmentTypeId: type.id,
        };
        return await this.assessmentRequestRepository.createAssessmentLayer(
          layerData,
        );
      }),
    );

    await this.actionLogRepository.save({
      action:
        dto.type === 'draft'
          ? ActionEnum.InitiatedSave
          : ActionEnum.InitiatedRegister,
      userId: member.id,
      roleIds: memberRoles.map((r) => r.id),
      status: ActionLogStatusEnum.SUCCESS,
      assessmentRequestId: createdRequest.id,
      assessmentRequestCurrentStateId: null,
      assessmentRequestNextStateId: createdRequest.stateId,
    });

    for (let i = 0; i < createdLayers.length; i++) {
      const layer = createdLayers[i];

      await this.actionLogRepository.save({
        action:
          dto.type === 'draft'
            ? ActionEnum.InitiatedSave
            : ActionEnum.InitiatedRegister,
        userId: member.id,
        roleIds: memberRoles.map((r) => r.id),
        status: ActionLogStatusEnum.SUCCESS,
        assessmentRequestId: createdRequest.id,
        assessmentLayerId: layer.id,
        assessmentLayerCurrentStateId: null,
        assessmentLayerNextStateId: layer.stateId,
      });
    }

    return {
      assessmentRequest: createdRequest,
      assessmentLayers: createdLayers,
    };
  }

  //------------------------------
  async updateAssessmentRequestStatusByActionMyTeam(
    requestId: string,
    data: UpdateRequestStatusByActionDto,
    member: Member,
    memberRoles: Role[],
  ) {
    const where: FindOptionsWhere<AssessmentRequest> = {
      id: requestId,
    };

    const teamMemberIds =
      await this.groupMembershipRepository.getUserTeamMembers(member.id);
    where.applicantId = In(teamMemberIds);

    const request = await this.assessmentRequestRepository.findOne({
      where,
    });

    if (!request) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'request' },
        }),
      );
    }
    const currentStateId = request?.stateId;

    const process = await this.processRepository.findOne({
      where: {
        name: ProcessEnum.AssessmentRequest,
      },
    });
    if (!process) {
      throw new InternalServerErrorException(
        `process not found: ${ProcessEnum.AssessmentRequest}`,
      );
    }
    const action = await this.actionRepository.findOne({
      where: {
        name: data.action,
        processId: process.id,
      },
    });
    if (!action) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'action' },
        }),
      );
    }

    const stateTransition = await this.stateTransitionService.getNextStatus({
      processId: process.id,
      actionId: action.id,
      currentStateId: request.stateId,
    });

    // Adding comment for the request
    if (data.comment) {
      const user = await this.memberRepository.findOne({
        where: { id: member.id },
        relations: { roles: true },
      });

      let roleId: string | undefined;
      if (data.action === ActionEnum.ApprovedAccept) {
        roleId = user!.roles!.find((role) => role.name === 'ciso')?.id;
      } else if (data.action === ActionEnum.SubmittedApprove) {
        roleId = user!.roles!.find(
          (role) => role.name === 'applicant manager',
        )?.id;
      } else {
        roleId = user!.roles!.find((role) => role.name === 'applicant')?.id;
      }
      const reqComment = new RequestComment({
        requestId,
        comment: data.comment,
        memberId: member.id,
        roleId,
      });
      await this.requestCommentRepository.save(reqComment);
    }
    // Adding comment for the request

    await this.assessmentRequestRepository.update(
      { id: requestId },
      { stateId: stateTransition.id },
    );

    // await this.assessmentLayerRepository.update(
    //   { assessmentRequestId: requestId },
    //   { stateId: stateTransition.id },
    // );

    await this.actionLogRepository.save({
      action: data.action,
      userId: member.id,
      roleIds: memberRoles.map((r) => r.id),
      status: ActionLogStatusEnum.SUCCESS,
      assessmentRequestId: request.id,
      assessmentRequestCurrentStateId: currentStateId,
      assessmentRequestNextStateId: stateTransition.id,
    });

    return true;
  }

  //------------------------------
  async provideSpecs(requestId: string, member: Member, memberRoles: Role[]) {
    const teamMemberIds =
      await this.groupMembershipRepository.getUserTeamMembers(member.id);
    const request = await this.assessmentRequestRepository.findOne({
      where: {
        id: requestId,
        applicantId: In(teamMemberIds),
      },
      relations: {
        asset: true,
        requestSpecContents: true,
        environment: true,
        assessmentLayers: {
          assessmentType: true,
          state: true,
        },
      },
    });

    if (!request) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'request' },
        }),
      );
    }

    const requestCurrentStateId = request.stateId;

    const allSpecItems = await this.requestSpecItemRepository.findAll({
      where: {
        assessmentType: request.assessmentLayers?.length
          ? { id: In(request.assessmentLayers.map((l) => l.assessmentTypeId)) }
          : undefined,
        environmentId: request.environmentId,
        assetTypeId: request.asset?.assetTypeId,
      },
      relations: { assessmentType: true },
    });

    if (
      !request.requestSpecContents ||
      allSpecItems.length !== request.requestSpecContents.length
    ) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_SPECS_NOT_FILLED_COMPLETELY'),
      );
    }

    const { process, action } = await this.getProcessAndAction(
      ProcessEnum.AssessmentLayer,
      ActionEnum.PendingLayerSpecsSubmit,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let anyLayerUpdated = false;
      let expectedState: State | null = null;
      for (const layer of request.assessmentLayers!) {
        if (layer.state) {
          if (layer.state.name !== 'pendingLayerSpecs') continue;
          const stateTransition =
            await this.stateTransitionService.getNextStatus({
              processId: process.id,
              actionId: action.id,
              currentStateId: layer.stateId,
            });

          await queryRunner.manager.update(
            AssessmentLayer,
            { id: layer.id },
            { stateId: stateTransition.id },
          );

          await this.actionLogRepository.save({
            action: ActionEnum.PendingLayerSpecsSubmit,
            userId: member.id,
            roleIds: memberRoles.map((r) => r.id),
            status: ActionLogStatusEnum.SUCCESS,
            assessmentRequestId: request.id,
            assessmentLayerId: layer.id,
            assessmentLayerCurrentStateId: layer.stateId,
            assessmentLayerNextStateId: stateTransition.id,
          });

          anyLayerUpdated = true;
        }

        if (!anyLayerUpdated) {
          throw new BadRequestException(
            'No layers are in "pendingLayerSpecs" state. Cannot submit specs.',
          );
        }

        expectedState = await this.stateService.findOne({
          where: {
            name: 'layerSpecPreEvaluation',
            processId: process.id,
          },
        });
      }

      if (!expectedState) {
        throw new InternalServerErrorException('Target layer state not found');
      }

      const requestNextState = await this.updateRequestIfAllLayersAccepted(
        queryRunner,
        request.id,
        expectedState.id,
        ActionEnum.AwaitingSpecsProvideSpecs,
        [
          ActionEnum.LayerSpecPreEvaluationAccept,
          ActionEnum.LayerSpecOnboardingAccept,
          ActionEnum.PendingLayerTestcasesSubmit,
          ActionEnum.LayerAssessmentCompletedAccept,
        ],
      );
      await queryRunner.commitTransaction();

      if (requestNextState) {
        await this.actionLogRepository.save({
          action: ActionEnum.AwaitingSpecsProvideSpecs,
          userId: member.id,
          roleIds: memberRoles.map((r) => r.id),
          status: ActionLogStatusEnum.SUCCESS,
          assessmentRequestId: request.id,
          assessmentRequestCurrentStateId: requestCurrentStateId,
          assessmentRequestNextStateId: requestNextState,
        });
      }
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  //------------------------------
  private async getProcessAndAction(processName: string, actionName: string) {
    const process = await this.processRepository.findOneBy({
      name: processName,
    });
    if (!process) {
      throw new InternalServerErrorException(
        `Process not found: ${processName}`,
      );
    }

    const action = await this.actionRepository.findOneBy({
      name: actionName,
      processId: process.id,
    });
    if (!action) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'action' },
        }),
      );
    }

    return { process, action };
  }

  //------------------------------
  private async updateRequestIfAllLayersAccepted(
    queryRunner: QueryRunner,
    assessmentRequestId: string,
    expectedStateId: string,
    targetActionName: string,
    nextActions?: ActionEnum[],
  ) {
    const layers = await queryRunner.manager.find(AssessmentLayer, {
      where: { assessmentRequestId },
      select: { stateId: true },
    });

    const expectedStateIds = [expectedStateId];

    if (nextActions) {
      const process = await this.processRepository.findOne({
        where: { name: ProcessEnum.AssessmentLayer },
      });
      if (!process) {
        throw new InternalServerErrorException(
          `Process not found: ${ProcessEnum.AssessmentLayer}`,
        );
      }
      for (let i = 0; i < nextActions.length; i++) {
        const element = nextActions[i];

        const action = await this.actionRepository.findOne({
          where: {
            name: element,
            processId: process.id,
          },
        });

        if (!action) {
          throw new BadRequestException(
            this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
              args: { property: 'action' },
            }),
          );
        }

        const nextRequestState =
          await this.stateTransitionService.getAllNextStatus({
            processId: process.id,
            actionId: action.id,
          });

        expectedStateIds.push(
          ...nextRequestState.map((nextRequestState) => nextRequestState.id),
        );
      }
    }

    const allAccepted = layers.every((layer: any) =>
      expectedStateIds.includes(layer.stateId),
    );

    if (allAccepted) {
      const [process, currentAssessmentRequest] = await Promise.all([
        this.processRepository.findOne({
          where: { name: ProcessEnum.AssessmentRequest },
        }),
        queryRunner.manager.findOne(AssessmentRequest, {
          where: { id: assessmentRequestId },
          select: { stateId: true },
        }),
      ]);

      if (!process) {
        throw new InternalServerErrorException(
          `Process not found: ${ProcessEnum.AssessmentRequest}`,
        );
      }

      if (!currentAssessmentRequest) {
        throw new InternalServerErrorException(
          'AssessmentRequest not found in transaction',
        );
      }

      const action = await this.actionRepository.findOne({
        where: {
          name: targetActionName,
          processId: process.id,
        },
      });

      if (!action) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'action' },
          }),
        );
      }

      const nextRequestState = await this.stateTransitionService.getNextStatus({
        processId: process.id,
        actionId: action.id,
        currentStateId: currentAssessmentRequest.stateId,
      });

      await queryRunner.manager.update(
        AssessmentRequest,
        { id: assessmentRequestId },
        { stateId: nextRequestState.id },
      );

      return nextRequestState.id;
    } else {
      return undefined;
    }
  }

  //------------------------------
  async updateAssessmentRequestStatusByAction(
    requestId: string,
    data: UpdateRequestStatusByActionDto,
    member: Member,
    memberRoles: Role[],
  ) {
    const request = await this.assessmentRequestRepository.findOne({
      where: { id: requestId },
    });

    if (data.action === ActionEnum.OnboardingFinalizeSpecs) {
      throw new ForbiddenException();
    }
    if (!request) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'request' },
        }),
      );
    }
    const process = await this.processRepository.findOne({
      where: {
        name: ProcessEnum.AssessmentRequest,
      },
    });
    if (!process) {
      throw new InternalServerErrorException(
        `process not found: ${ProcessEnum.AssessmentRequest}`,
      );
    }
    const action = await this.actionRepository.findOne({
      where: {
        name: data.action,
        processId: process.id,
      },
    });
    if (!action) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'action' },
        }),
      );
    }

    const stateTransition = await this.stateTransitionService.getNextStatus({
      processId: process.id,
      actionId: action.id,
      currentStateId: request.stateId,
    });

    await this.assessmentRequestRepository.update(
      { id: requestId },
      { stateId: stateTransition.id },
    );

    if (data.action === ActionEnum.ApprovedAccept) {
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
          name: ActionEnum.InitiatedRegister,
          processId: process.id,
        },
      });
      if (!action) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'action' },
          }),
        );
      }

      const layers = await this.assessmentLayerRepository.find({
        assessmentRequestId: request.id,
      });

      if (layers.length === 0) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'layers' },
          }),
        );
      }
      const stateTransition = await this.stateTransitionService.getNextStatus({
        processId: process.id,
        actionId: action.id,
        currentStateId: layers[0].stateId,
      });

      if (stateTransition) {
        await this.assessmentLayerRepository.updateManyStateByAssessmentRequestId(
          requestId,
          { stateId: stateTransition.id },
        );
      }

      for (let i = 0; i < layers.length; i++) {
        const element = layers[i];
        await this.actionLogRepository.save({
          action: data.action,
          userId: member.id,
          roleIds: memberRoles.map((r) => r.id),
          status: ActionLogStatusEnum.SUCCESS,
          assessmentRequestId: request.id,
          assessmentLayerId: element.id,
          assessmentLayerCurrentStateId: element.stateId,
          assessmentLayerNextStateId: stateTransition.id,
        });
      }
    }

    if (data.action === ActionEnum.StatusReportedFinalize) {
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
          name: ActionEnum.LayerAssessmentReviewAccept,
          processId: process.id,
        },
      });
      if (!action) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'action' },
          }),
        );
      }

      const layers = await this.assessmentLayerRepository.find({
        assessmentRequestId: request.id,
      });

      if (layers.length === 0) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'layers' },
          }),
        );
      }
      const stateTransition = await this.stateTransitionService.getNextStatus({
        processId: process.id,
        actionId: action.id,
        currentStateId: layers[0].stateId,
      });

      if (stateTransition) {
        await this.assessmentLayerRepository.updateManyStateByAssessmentRequestId(
          requestId,
          { stateId: stateTransition.id },
        );
      }

      for (let i = 0; i < layers.length; i++) {
        const element = layers[i];
        await this.actionLogRepository.save({
          action: data.action,
          userId: member.id,
          roleIds: memberRoles.map((r) => r.id),
          status: ActionLogStatusEnum.SUCCESS,
          assessmentRequestId: request.id,
          assessmentLayerId: element.id,
          assessmentLayerCurrentStateId: element.stateId,
          assessmentLayerNextStateId: stateTransition.id,
        });
      }
    }

    if (data.action === ActionEnum.LayerReportIssuedRemark) {
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
          name: ActionEnum.LayerReportIssuedRemark,
          processId: process.id,
        },
      });
      if (!action) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'action' },
          }),
        );
      }

      const layers = await this.assessmentLayerRepository.find({
        assessmentRequestId: request.id,
      });

      if (layers.length === 0) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'layers' },
          }),
        );
      }
      const stateTransition = await this.stateTransitionService.getNextStatus({
        processId: process.id,
        actionId: action.id,
        currentStateId: layers[0].stateId,
      });

      if (stateTransition) {
        await this.assessmentLayerRepository.updateManyStateByAssessmentRequestId(
          requestId,
          { stateId: stateTransition.id },
        );
      }

      for (let i = 0; i < layers.length; i++) {
        const element = layers[i];
        await this.actionLogRepository.save({
          action: data.action,
          userId: member.id,
          roleIds: memberRoles.map((r) => r.id),
          status: ActionLogStatusEnum.SUCCESS,
          assessmentRequestId: request.id,
          assessmentLayerId: element.id,
          assessmentLayerCurrentStateId: element.stateId,
          assessmentLayerNextStateId: stateTransition.id,
        });
      }
    }

    if (data.action === ActionEnum.StatusReportedNeedChanges) {
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
          name: ActionEnum.LayerAssessmentReviewNeedModifications,
          processId: process.id,
        },
      });
      if (!action) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'action' },
          }),
        );
      }

      const layers = await this.assessmentLayerRepository.find({
        assessmentRequestId: request.id,
      });

      if (layers.length === 0) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'layers' },
          }),
        );
      }
      const stateTransition = await this.stateTransitionService.getNextStatus({
        processId: process.id,
        actionId: action.id,
        currentStateId: layers[0].stateId,
      });

      if (stateTransition) {
        await this.assessmentLayerRepository.updateManyStateByAssessmentRequestId(
          requestId,
          { stateId: stateTransition.id },
        );
      }

      for (let i = 0; i < layers.length; i++) {
        const element = layers[i];
        await this.actionLogRepository.save({
          action: data.action,
          userId: member.id,
          roleIds: memberRoles.map((r) => r.id),
          status: ActionLogStatusEnum.SUCCESS,
          assessmentRequestId: request.id,
          assessmentLayerId: element.id,
          assessmentLayerCurrentStateId: element.stateId,
          assessmentLayerNextStateId: stateTransition.id,
        });
      }
    }

    if (data.action === ActionEnum.LayerReportIssuedRefer) {
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
          name: ActionEnum.LayerReportIssuedRefer,
          processId: process.id,
        },
      });
      if (!action) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'action' },
          }),
        );
      }

      const layers = await this.assessmentLayerRepository.find({
        assessmentRequestId: request.id,
      });

      if (layers.length === 0) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'layers' },
          }),
        );
      }
      const stateTransition = await this.stateTransitionService.getNextStatus({
        processId: process.id,
        actionId: action.id,
        currentStateId: layers[0].stateId,
      });

      if (stateTransition) {
        await this.assessmentLayerRepository.updateManyStateByAssessmentRequestId(
          requestId,
          { stateId: stateTransition.id },
        );
      }

      for (let i = 0; i < layers.length; i++) {
        const element = layers[i];
        await this.actionLogRepository.save({
          action: data.action,
          userId: member.id,
          roleIds: memberRoles.map((r) => r.id),
          status: ActionLogStatusEnum.SUCCESS,
          assessmentRequestId: request.id,
          assessmentLayerId: element.id,
          assessmentLayerCurrentStateId: element.stateId,
          assessmentLayerNextStateId: stateTransition.id,
        });
      }
    }

    if (data.action === ActionEnum.RemediateLayerVulnerabilitiesDecline) {
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
          name: ActionEnum.RemediateLayerVulnerabilitiesDecline,
          processId: process.id,
        },
      });
      if (!action) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'action' },
          }),
        );
      }

      const layers = await this.assessmentLayerRepository.find({
        assessmentRequestId: request.id,
      });

      if (layers.length === 0) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'layers' },
          }),
        );
      }
      const stateTransition = await this.stateTransitionService.getNextStatus({
        processId: process.id,
        actionId: action.id,
        currentStateId: layers[0].stateId,
      });

      if (stateTransition) {
        await this.assessmentLayerRepository.updateManyStateByAssessmentRequestId(
          requestId,
          { stateId: stateTransition.id },
        );
      }

      for (let i = 0; i < layers.length; i++) {
        const element = layers[i];
        await this.actionLogRepository.save({
          action: data.action,
          userId: member.id,
          roleIds: memberRoles.map((r) => r.id),
          status: ActionLogStatusEnum.SUCCESS,
          assessmentRequestId: request.id,
          assessmentLayerId: element.id,
          assessmentLayerCurrentStateId: element.stateId,
          assessmentLayerNextStateId: stateTransition.id,
        });
      }
    }

    if (data.action === ActionEnum.RemediateLayerVulnerabilitiesFinalize) {
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
          name: ActionEnum.RemediateLayerVulnerabilitiesFinalize,
          processId: process.id,
        },
      });
      if (!action) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'action' },
          }),
        );
      }

      const layers = await this.assessmentLayerRepository.find({
        assessmentRequestId: request.id,
      });

      if (layers.length === 0) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'layers' },
          }),
        );
      }
      const stateTransition = await this.stateTransitionService.getNextStatus({
        processId: process.id,
        actionId: action.id,
        currentStateId: layers[0].stateId,
      });

      if (stateTransition) {
        await this.assessmentLayerRepository.updateManyStateByAssessmentRequestId(
          requestId,
          { stateId: stateTransition.id },
        );
      }

      for (let i = 0; i < layers.length; i++) {
        const element = layers[i];
        await this.actionLogRepository.save({
          action: data.action,
          userId: member.id,
          roleIds: memberRoles.map((r) => r.id),
          status: ActionLogStatusEnum.SUCCESS,
          assessmentRequestId: request.id,
          assessmentLayerId: element.id,
          assessmentLayerCurrentStateId: element.stateId,
          assessmentLayerNextStateId: stateTransition.id,
        });
      }
    }

    if (data.action === ActionEnum.ReviewLayerRemediatesReject) {
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
          name: ActionEnum.RemediateLayerVulnerabilitiesDecline,
          processId: process.id,
        },
      });
      if (!action) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'action' },
          }),
        );
      }

      const layers = await this.assessmentLayerRepository.find({
        assessmentRequestId: request.id,
      });

      if (layers.length === 0) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'layers' },
          }),
        );
      }
      const stateTransition = await this.stateTransitionService.getNextStatus({
        processId: process.id,
        actionId: action.id,
        currentStateId: layers[0].stateId,
      });

      if (stateTransition) {
        await this.assessmentLayerRepository.updateManyStateByAssessmentRequestId(
          requestId,
          { stateId: stateTransition.id },
        );
      }

      for (let i = 0; i < layers.length; i++) {
        const element = layers[i];
        await this.actionLogRepository.save({
          action: data.action,
          userId: member.id,
          roleIds: memberRoles.map((r) => r.id),
          status: ActionLogStatusEnum.SUCCESS,
          assessmentRequestId: request.id,
          assessmentLayerId: element.id,
          assessmentLayerCurrentStateId: element.stateId,
          assessmentLayerNextStateId: stateTransition.id,
        });
      }
    }

    if (data.action === ActionEnum.ReviewLayerRemediatesApprove) {
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
          name: ActionEnum.ReviewLayerRemediatesApprove,
          processId: process.id,
        },
      });
      if (!action) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'action' },
          }),
        );
      }

      const layers = await this.assessmentLayerRepository.find({
        assessmentRequestId: request.id,
      });

      if (layers.length === 0) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'layers' },
          }),
        );
      }
      const stateTransition = await this.stateTransitionService.getNextStatus({
        processId: process.id,
        actionId: action.id,
        currentStateId: layers[0].stateId,
      });

      if (stateTransition) {
        await this.assessmentLayerRepository.updateManyStateByAssessmentRequestId(
          requestId,
          { stateId: stateTransition.id },
        );
      }

      for (let i = 0; i < layers.length; i++) {
        const element = layers[i];
        await this.actionLogRepository.save({
          action: data.action,
          userId: member.id,
          roleIds: memberRoles.map((r) => r.id),
          status: ActionLogStatusEnum.SUCCESS,
          assessmentRequestId: request.id,
          assessmentLayerId: element.id,
          assessmentLayerCurrentStateId: element.stateId,
          assessmentLayerNextStateId: stateTransition.id,
        });
      }
    }

    await this.actionLogRepository.save({
      action: data.action,
      userId: member.id,
      roleIds: memberRoles.map((r) => r.id),
      status: ActionLogStatusEnum.SUCCESS,
      assessmentRequestId: request.id,
      assessmentRequestCurrentStateId: request.stateId,
      assessmentRequestNextStateId: stateTransition.id,
    });

    return true;
  }

  //------------------------------
  async getOneInfo(input: {
    id: string;
    memberRoles: string[];
    memberId: string;
  }) {
    const { id, memberRoles, memberId } = input;

    const actions = await this.actionRepository.findAll({
      select: { id: true, name: true, process: { name: true } },
      relations: ['process'],
      where: { roles: { id: In(memberRoles) } },
    });

    const where: FindOptionsWhere<AssessmentRequest> = {
      id,
    };

    if (
      actions.findIndex((action) => {
        return (
          action.name === ActionEnum.Read &&
          action.process?.name === ProcessEnum.AssessmentRequest
        );
      }) === -1
    ) {
      const teamMemberIds =
        await this.groupMembershipRepository.getUserTeamMembers(memberId);
      where.applicantId = In(teamMemberIds);
    }

    const foundRequest = await this.assessmentRequestRepository.findOne({
      where,
      order: { createdAt: 'DESC' },
      relations: {
        state: true,
        environment: true,
        asset: true,
        requestSpecContents: true,
        testcaseContents: true,
        assessmentLayers: {
          assessmentTeams: { member: true },
          assessmentType: true,
          state: true,
        },
      },
    });

    if (!foundRequest) {
      throw new NotFoundException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'request' },
        }),
      );
    }
    if (!foundRequest.assessmentLayers) {
      return foundRequest;
    }

    await userMapperLevel2<AssessmentLayer, AssessmentTeam>(
      foundRequest.assessmentLayers,
      'assessmentTeams',
      'memberId',
    );

    foundRequest.assessmentLayers.sort((a, b) =>
      a.assessmentType!.name > b.assessmentType!.name
        ? 1
        : b.assessmentType!.name > a.assessmentType!.name
          ? -1
          : 0,
    );

    return foundRequest;
  }

  //------------------------------
  async getAssessmentVulnerabilityCount(input: {
    id: string;
    memberRoles: Role[];
    memberId: string;
  }) {
    const { id, memberRoles, memberId } = input;

    const actions = await this.actionRepository.findAll({
      select: { id: true, name: true, process: { name: true } },
      relations: ['process'],
      where: {
        roles: { id: In(memberRoles.map((memberRole) => memberRole.id)) },
      },
    });

    const where: FindOptionsWhere<AssessmentRequest> = {
      id,
    };

    const isApplicantOrApplicantManager = memberRoles.findIndex((memberRole) =>
      ['applicant', 'applicant manager'].includes(memberRole.name),
    );

    const hasReadAccess = actions.some(
      (action) =>
        action.name === ActionEnum.Read &&
        action.process?.name === ProcessEnum.AssessmentLayer,
    );

    if (!hasReadAccess) {
      if (isApplicantOrApplicantManager !== -1) {
        const teamMemberIds =
          await this.groupMembershipRepository.getUserTeamMembers(memberId);

        where.applicantId = In(teamMemberIds);
      } else {
        // @TODO must be checked if is this request's auditor
      }
    }

    const foundRequest = await this.assessmentRequestRepository.findOne({
      where,
      order: { createdAt: 'DESC' },
      relations: {
        assessmentLayers: { assessmentType: true },
        testcaseContents: {
          testcaseItem: { testcaseGroup: { assessmentType: true } },
        },
      },
    });

    if (!foundRequest) {
      throw new NotFoundException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'request' },
        }),
      );
    }
    if (!foundRequest.assessmentLayers) {
      throw new NotFoundException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'layer' },
        }),
      );
    }
    const response: Record<string, Record<string, any>> = {};
    for (let i = 0; i < foundRequest.assessmentLayers.length; i++) {
      const assessmentLayer = foundRequest.assessmentLayers[i];
      if (!assessmentLayer.assessmentType?.name) {
        continue;
      }
      response[assessmentLayer.assessmentType.name] = {};
    }

    if (!foundRequest.testcaseContents) {
      return response;
    }

    for (let i = 0; i < foundRequest.testcaseContents.length; i++) {
      const testcaseContent = foundRequest.testcaseContents[i];
      if (!testcaseContent.testcaseItem?.testcaseGroup?.assessmentType?.name) {
        continue;
      }
      if (!testcaseContent.criticality) {
        continue;
      }

      if (
        !testcaseContent.status ||
        ![ContentStatus.Failed, ContentStatus.NotPerforming].includes(
          testcaseContent.status,
        )
      ) {
        continue;
      }

      if (
        !response[
          testcaseContent.testcaseItem.testcaseGroup.assessmentType.name
        ].layer
      ) {
        response[
          testcaseContent.testcaseItem.testcaseGroup.assessmentType.name
        ].layerId = foundRequest.assessmentLayers.find(
          (assessmentLayer) =>
            assessmentLayer.assessmentTypeId ===
            testcaseContent.testcaseItem?.testcaseGroup?.assessmentTypeId,
        );
      }

      response[
        testcaseContent.testcaseItem.testcaseGroup.assessmentType.name
      ].all =
        (response[
          testcaseContent.testcaseItem.testcaseGroup.assessmentType.name
        ].all || 0) + 1;

      response[testcaseContent.testcaseItem.testcaseGroup.assessmentType.name][
        testcaseContent.criticality
      ] =
        (response[
          testcaseContent.testcaseItem.testcaseGroup.assessmentType.name
        ][testcaseContent.criticality] || 0) + 1;
    }

    // if (!foundRequest.assessmentLayers) {
    //   return foundRequest;
    // }

    // await userMapperLevel2<AssessmentLayer, AssessmentTeam>(
    //   foundRequest.assessmentLayers,
    //   'assessmentTeams',
    //   'memberId',
    // );

    // foundRequest.assessmentLayers.sort((a, b) =>
    //   a.assessmentType!.name > b.assessmentType!.name
    //     ? 1
    //     : b.assessmentType!.name > a.assessmentType!.name
    //       ? -1
    //       : 0,
    // );

    return response;
  }

  //------------------------------
  async getAllInfo(skip: number, take: number) {
    const [foundRequest, total] =
      await this.assessmentRequestRepository.findAllPagination(skip, take, {
        order: { createdAt: 'DESC' },
        relations: {
          environment: true,
          asset: true,
          assessmentLayers: {
            assessmentType: true,
          },
        },
      });

    const result = foundRequest.filter((item) => item.asset != null);
    return { result, count: total };
  }

  //------------------------------
  async cartable(query: GetCartableDto, memberRoles: string[], member: Member) {
    const actions = await this.actionRepository.findAll({
      select: { id: true, name: true, process: { name: true } },
      relations: { process: true },
      where: { roles: { id: In(memberRoles) } },
    });

    const [fetchedRequests, totalRequests] =
      await this.assessmentRequestRepository.getRequestCartable(
        actions,
        member,
        query.requestLastUpdatedAt,
        query.requestLastId,
      );

    const [fetchedLayers, totalLayers] =
      await this.assessmentLayerRepository.getLayerCartable(
        actions,
        member,
        query.layerLastUpdatedAt,
        query.layerLastId,
      );

    const layerResult = fetchedLayers.map((layer) => {
      return {
        ...layer.assessmentRequest,
        type: 'Layer',
        state: layer.state,
        updatedAt: layer.updatedAt,
        layerId: layer.id,
        layerDescription: layer.assessmentType?.description,
      };
    });

    let dataToReturn = [...layerResult, ...fetchedRequests];
    dataToReturn.sort(function (a, b) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    dataToReturn = dataToReturn.splice(0, 20);

    return {
      data: dataToReturn,
      count: totalRequests + totalLayers,
    };
  }

  //------------------------------
  async getUsersRequests(
    query: FindAllAssessmentQueryDto,
    memberId: string,
    memberRoles: string[],
  ) {
    try {
      const actions = await this.actionRepository.findAll({
        select: { id: true, name: true, process: { name: true } },
        relations: ['process'],
        where: { roles: { id: In(memberRoles) } },
      });

      const where: FindOptionsWhere<AssessmentRequest> = {};

      if (
        actions.findIndex((action) => {
          return (
            action.name === ActionEnum.Read &&
            action.process?.name === ProcessEnum.AssessmentRequest
          );
        }) === -1
      ) {
        const teamMemberIds =
          await this.groupMembershipRepository.getUserTeamMembers(memberId);
        where.applicantId = In(teamMemberIds);
      }

      if (query.requestNumber) {
        where.requestNumber = Like(`%${query.requestNumber}%`);
      }

      if (query.assetName) {
        where.asset = { title: ILike(`%${query.assetName}%`) };
      }

      if (query.stateId) {
        where.stateId = query.stateId;
      }

      if (query.environmentId) {
        where.environmentId = query.environmentId;
      }

      if (query.createdAtStart && query.createdAtEnd) {
        where.createdAt = Between(
          new Date(query.createdAtStart),
          new Date(query.createdAtEnd),
        );
      } else if (query.createdAtStart) {
        where.createdAt = MoreThanOrEqual(new Date(query.createdAtStart));
      } else if (query.createdAtEnd) {
        where.createdAt = LessThanOrEqual(new Date(query.createdAtEnd));
      }

      if (query.updatedAtStart && query.updatedAtEnd) {
        where.updatedAt = Between(
          new Date(query.updatedAtStart),
          new Date(query.updatedAtEnd),
        );
      } else if (query.updatedAtStart) {
        where.updatedAt = MoreThanOrEqual(new Date(query.updatedAtStart));
      } else if (query.updatedAtEnd) {
        where.updatedAt = LessThanOrEqual(new Date(query.updatedAtEnd));
      }

      return this.assessmentRequestRepository.findAllPagination(
        query.skip,
        query.take,
        {
          where,
          order: { createdAt: 'DESC' },
          relations: { state: true, environment: true, asset: true },
        },
      );
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  //------------------------------
  async updateAssessmentRequest(requestId: string, data: UpdateRequestDto) {
    const request = await this.assessmentRequestRepository.findOne({
      where: { id: requestId },
      relations: { assessmentLayers: true },
    });

    if (!request) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'request' },
        }),
      );
    }

    if (data.environmentId) {
      const environment = await this.environmentService.findOne({
        where: { id: data.environmentId },
      });
      if (!environment) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'environment' },
          }),
        );
      }

      request.environment = new Environment({ id: environment.id });
      await this.assessmentRequestRepository.save(request);
    }

    const assessmentTypes = await this.assessmentTypeRepository.findAll({
      where: { id: In(data.assessmentTypeIds) },
    });

    // const state = await this.statesRepository.findOne({
    //   where: {
    //     name: 'revised',
    //     process: { name: ProcessEnum.AssessmentRequest },
    //   },
    // });
    // if (!state) {
    //   throw new BadRequestException(
    //     this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
    //       args: { property: 'state' },
    //     }),
    //   );
    // }

    for (let i = 0; i < request.assessmentLayers!.length; i++) {
      const foundAssessmentLayer = request.assessmentLayers![i];
      const foundIndex = assessmentTypes.findIndex((assessmentType) => {
        return foundAssessmentLayer.assessmentTypeId === assessmentType.id;
      });

      if (foundIndex === -1) {
        try {
          await this.assessmentLayerRepository.findAndDelete({
            id: foundAssessmentLayer.id,
          });
        } catch (error) {
          console.log(error);
        }
      }
    }

    const foundAssessmentLayers = await this.assessmentLayerRepository.findAll({
      where: {
        assessmentRequestId: request.id,
        assessmentTypeId: In(data.assessmentTypeIds),
      },
    });

    for (let i = 0; i < assessmentTypes.length; i++) {
      const assessmentType = assessmentTypes[i];
      const foundIndex = foundAssessmentLayers.findIndex(
        (foundAssessmentLayer) => {
          return foundAssessmentLayer.assessmentTypeId === assessmentType.id;
        },
      );
      if (foundIndex === -1 && request.assessmentLayers?.[0].stateId) {
        await this.assessmentRequestRepository.createAssessmentLayer({
          stateId: request.assessmentLayers?.[0].stateId,
          assessmentRequest: request,
          assessmentTypeId: assessmentType.id,
        });
      }
    }
  }

  async requestClosure(
    id: string,
    data: RequestClosureDto,
    member: Member,
    memberRoles: Role[],
  ) {
    const request = await this.assessmentRequestRepository.findOne({
      where: { id },
      relations: { assessmentLayers: true },
    });
    if (!request || !request.assessmentLayers) {
      throw new NotFoundException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'request' },
        }),
      );
    }

    const requestCurrentStateId = request.stateId;

    const { process, action } = await this.getProcessAndAction(
      ProcessEnum.AssessmentRequest,
      ActionEnum.StatusReportedFinalize,
    );
    const stateTransition = await this.stateTransitionService.getNextStatus({
      processId: process.id,
      actionId: action.id,
      currentStateId: request.stateId,
    });

    // const { process: processLayer, action: actionLayer } =
    //   await this.getProcessAndAction(
    //     ProcessEnum.AssessmentLayer,
    //     ActionEnum.LayerAssessmentReviewFinish,
    //   );
    // const stateTransitionLayer =
    //   await this.stateTransitionService.getNextStatus({
    //     processId: processLayer.id,
    //     actionId: actionLayer.id,
    //     currentStateId: request.assessmentLayers[0].stateId,
    //   });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      request.finalState = data.finalState;
      request.stateId = stateTransition.id;
      await queryRunner.manager.save(request);
      // for (let i = 0; i < request.assessmentLayers.length; i++) {
      //   const assessmentLayer = request.assessmentLayers[i];
      //   assessmentLayer.stateId = stateTransitionLayer.id;
      //   await queryRunner.manager.save(assessmentLayer);
      // }
      // Adding comment for the request
      if (data.comment) {
        const user = await this.memberRepository.findOne({
          where: { id: member.id },
          relations: { roles: true },
        });
        const roleId = user!.roles!.find((role) => role.name === 'ciso')?.id;
        const reqComment = new RequestComment({
          comment: data.comment,
          memberId: member.id,
          requestId: id,
          roleId,
        });
        await queryRunner.manager.save(reqComment);
      }
      // Adding comment for the request
      await queryRunner.commitTransaction();

      await this.actionLogRepository.save({
        action: ActionEnum.StatusReportedFinalize,
        userId: member.id,
        roleIds: memberRoles.map((r) => r.id),
        status: ActionLogStatusEnum.SUCCESS,
        assessmentRequestId: request.id,
        assessmentRequestCurrentStateId: requestCurrentStateId,
        assessmentRequestNextStateId: stateTransition.id,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
