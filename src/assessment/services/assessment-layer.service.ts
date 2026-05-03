import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ActionLogRepository } from 'src/action-log/repositories/action-log.repository';
import { ActionRepository } from 'src/action/repositories/action.repository';
import { ActionLogStatusEnum } from 'src/common/enums/action-log.enum';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { userMapperLevel1 } from 'src/common/helpers/user-mapper-level-1';
import { LayerComment } from 'src/layer-comment/entities/layer-comment.entity';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
import { ProcessRepository } from 'src/process/repositories/process.repository';
import { Role } from 'src/role/entities/role.entity';
import { StateTransitionRepository } from 'src/state-transition/repositories/state-transition.repository';
import { StateTransitionService } from 'src/state-transition/services/state-transition.service';
import { State } from 'src/states/entities/state.entity';
import { StatesRepository } from 'src/states/repositories/state.repository';
import { TestcaseContent } from 'src/test-case/entities/testcase-content.entity';
import { TestcaseItem } from 'src/test-case/entities/testcase-item.entity';
import { DataSource, In, QueryRunner } from 'typeorm';
import { UpdateAssessmentLayerAuditorsDto } from '../dto/input/update-assessment-layer-add-auditors.dto';
import { UpdateAssessmentLayerAddSupervisorsDto } from '../dto/input/update-assessment-layer-add-supervisors.dto';
import { UpdateRequestLayerStatusByActionDto } from '../dto/input/update-request-layer-status-by-action.dto';
import { UpdateMultipleLayersByActionDto } from '../dto/input/update-request-layers-action.dto';
import { AssessmentLayer } from '../entities/assessment-layer.entity';
import { AssessmentRequest } from '../entities/assessment-request.entity';
import { AssessmentTeam } from '../entities/assessment-team.entity';
import { AssessmentLayerRepository } from '../repositories/assessment-layer.repository';
import { AssessmentRequestRepository } from '../repositories/assessment-request.repository';
import { AssessmentTeamRepository } from '../repositories/assessment-team.repository';

@Injectable()
export class AssessmentLayerService {
  constructor(
    private readonly assessmentLayerRepository: AssessmentLayerRepository,
    private readonly memberRepository: MemberRepository,
    private readonly assessmentTeamRepository: AssessmentTeamRepository,
    private readonly assessmentRequestRepository: AssessmentRequestRepository,
    private readonly stateTransitionRepository: StateTransitionRepository,
    private readonly stateTransitionService: StateTransitionService,
    private readonly processRepository: ProcessRepository,
    private readonly stateRepository: StatesRepository,
    private readonly i18nService: I18nService,
    private readonly actionRepository: ActionRepository,
    private readonly dataSource: DataSource,
    private actionLogRepository: ActionLogRepository,
  ) {}

  //------------------------------
  async addSupervisor(
    data: UpdateAssessmentLayerAddSupervisorsDto,
    member: Member,
    memberRoles: Role[],
  ): Promise<boolean> {
    return this.assessmentLayerRepository.addSupervisor(
      data,
      member,
      memberRoles,
    );
  }

  //------------------------------
  async addAuditors(
    data: UpdateAssessmentLayerAuditorsDto,
    member: Member,
    roles: Role[],
  ): Promise<boolean> {
    return this.assessmentLayerRepository.addAuditors(data, member, roles);
  }

  //------------------------------
  async cartable(
    skip: number,
    take: number,
    memberRoles: Role[],
    memberId: string,
  ) {
    const actions = await this.actionRepository.findAll({
      select: { id: true, name: true },
      relations: { roles: true },
      where: {
        roles: { id: In(memberRoles.map((role) => role.id)) },
      },
    });

    const actionIds = actions.map((a) => a.id);
    const actionNames = actions.map((a) => a.name);

    const stateTransitions = await this.stateTransitionRepository.findAll({
      where: { actionId: In(actionIds) },
      select: { currentStateId: true },
    });

    const allowedStateIds = stateTransitions.map((st) => st.currentStateId);

    if (allowedStateIds.length === 0) {
      return { result: [], count: 0 };
    }

    const [layers, total] =
      await this.assessmentLayerRepository.findAllPagination(skip, take, {
        where: {
          stateId: In(allowedStateIds),
          assessmentTeams: { memberId },
          assessmentType: {
            name: In(memberRoles.map((role) => role.name.split(' ')[0])),
          },
        },
        relations: {
          state: true,
          assessmentType: true,
          assessmentTeams: true,
          assessmentRequest: {
            state: true,
            asset: true,
          },
        },
        order: { createdAt: 'DESC' },
      });

    if (!actionNames.includes(ActionEnum.LayerSpecOnboardingAccept)) {
      return { result: layers, count: total };
    }

    const layerSpecOnboardingState = await this.getStateByNameAndProcessName(
      'layerSpecOnboarding',
      ProcessEnum.AssessmentLayer,
    );

    const onboardingRequestState = await this.getStateByNameAndProcessName(
      'onboarding',
      ProcessEnum.AssessmentRequest,
    );

    const layerReEvaluationRequestedState =
      await this.getStateByNameAndProcessName(
        'layerReEvaluationRequested',
        ProcessEnum.AssessmentLayer,
      );

    const reEvaluationRequestedRequestState =
      await this.getStateByNameAndProcessName(
        'reEvaluationRequested',
        ProcessEnum.AssessmentRequest,
      );

    const layerAssessmentCompletedState =
      await this.getStateByNameAndProcessName(
        'layerAssessmentCompleted',
        ProcessEnum.AssessmentLayer,
      );

    const statusReportedRequestState = await this.getStateByNameAndProcessName(
      'statusReported',
      ProcessEnum.AssessmentRequest,
    );

    const restrictedLayerStateIds = new Set([
      layerSpecOnboardingState.id,
      layerReEvaluationRequestedState.id,
      layerAssessmentCompletedState.id,
    ]);

    const allowedRequestStateIds = new Set([
      onboardingRequestState.id,
      reEvaluationRequestedRequestState.id,
      statusReportedRequestState.id,
    ]);

    const filteredLayers = layers.filter((layer) => {
      if (!restrictedLayerStateIds.has(layer.stateId)) {
        return true;
      }

      return (
        layer.assessmentRequest &&
        allowedRequestStateIds.has(layer.assessmentRequest.stateId)
      );
    });

    return {
      result: filteredLayers,
      count: filteredLayers.length,
    };
  }

  //------------------------------
  async updateAssessmentLayerStatusByActionMyTeam(
    layerId: string,
    data: UpdateRequestLayerStatusByActionDto,
    memberId: string,
    memberRoles: Role[],
  ) {
    const requestLayer = await this.assessmentLayerRepository.findOne({
      where: {
        id: layerId,
        assessmentTeams: { memberId: memberId },
      },
      relations: { assessmentRequest: true },
    });

    if (!requestLayer || !requestLayer.assessmentRequest) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'layer' },
        }),
      );
    }

    const layerCurrentStateId = requestLayer.stateId;
    const currentRequestState = requestLayer.assessmentRequest.stateId;

    const { process, action } = await this.getProcessAndAction(
      ProcessEnum.AssessmentLayer,
      data.action,
    );

    const stateTransition = await this.stateTransitionService.getNextStatus({
      processId: process.id,
      actionId: action.id,
      currentStateId: requestLayer.stateId,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        AssessmentLayer,
        { id: layerId },
        { stateId: stateTransition.id },
      );

      // Adding comment for the layer
      if (data.comment) {
        const user = await this.memberRepository.findOne({
          where: { id: memberId },
          relations: { roles: true },
        });

        const roleId = user!.roles!.find(
          (role) => role.name.split(' ')[1] === 'auditor',
        )?.id;
        const layerComment = new LayerComment({
          layerId,
          comment: data.comment,
          memberId,
          roleId,
        });
        await queryRunner.manager.save(LayerComment, layerComment);
      }
      // Adding comment for the layer

      if (data.action === ActionEnum.LayerSpecPreEvaluationNeedModifications) {
        const { process, action } = await this.getProcessAndAction(
          ProcessEnum.AssessmentRequest,
          ActionEnum.PreEvaluationReject,
        );

        const stateTransition = await this.stateTransitionService.getNextStatus(
          {
            processId: process.id,
            actionId: action.id,
            currentStateId: requestLayer.assessmentRequest!.stateId,
          },
        );

        await queryRunner.manager.update(
          AssessmentRequest,
          { id: requestLayer.assessmentRequestId },
          { stateId: stateTransition.id },
        );
      }

      let nextRequestState: string | undefined;
      if (data.action === ActionEnum.LayerSpecPreEvaluationAccept) {
        nextRequestState = await this.updateRequestIfAllLayersAccepted(
          queryRunner,
          requestLayer.assessmentRequest!,
          stateTransition.id,
          ActionEnum.PreEvaluationAccept,
          [
            ActionEnum.LayerSpecOnboardingAccept,
            ActionEnum.PendingLayerTestcasesSubmit,
            ActionEnum.LayerAssessmentCompletedAccept,
            ActionEnum.LayerAssessmentReviewAccept,
            ActionEnum.LayerReportIssuedRefer,
            ActionEnum.RemediateLayerVulnerabilitiesFinalize,
            ActionEnum.ReviewLayerRemediatesApprove,
            ActionEnum.LayerReEvaluationRequestedAccept,
          ],
        );
      }

      if (data.action === ActionEnum.LayerSpecOnboardingAccept) {
        nextRequestState = await this.updateRequestIfAllLayersAccepted(
          queryRunner,
          requestLayer.assessmentRequest!,
          stateTransition.id,
          ActionEnum.OnboardingFinalizeSpecs,
          [
            ActionEnum.PendingLayerTestcasesSubmit,
            ActionEnum.LayerAssessmentCompletedAccept,
            ActionEnum.LayerAssessmentReviewAccept,
            ActionEnum.LayerReportIssuedRefer,
            ActionEnum.RemediateLayerVulnerabilitiesFinalize,
            ActionEnum.ReviewLayerRemediatesApprove,
            ActionEnum.LayerReEvaluationRequestedAccept,
          ],
        );
      }
      await queryRunner.commitTransaction();

      await this.actionLogRepository.save({
        action: data.action as ActionEnum,
        userId: memberId,
        roleIds: memberRoles.map((r) => r.id),
        status: ActionLogStatusEnum.SUCCESS,
        assessmentRequestId: requestLayer.assessmentRequestId,
        assessmentLayerId: requestLayer.id,
        assessmentLayerCurrentStateId: layerCurrentStateId,
        assessmentLayerNextStateId: stateTransition.id,
        assessmentRequestCurrentStateId: currentRequestState,
        assessmentRequestNextStateId: nextRequestState,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return true;
  }

  //------------------------------
  async getOneAssessmentLayer(
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

    const isApplicantOrApplicantManager = memberRoles.findIndex((memberRole) =>
      ['applicant', 'applicant manager'].includes(memberRole.name),
    );

    const isCiso = memberRoles.findIndex(
      (memberRole) => memberRole.name === 'ciso',
    );

    const isAuditor = memberRoles.findIndex((memberRole) =>
      memberRole.name.includes('auditor'),
    );

    const isSupervisor = memberRoles.findIndex((memberRole) =>
      memberRole.name.includes('supervisor'),
    );

    const isOperator = memberRoles.findIndex((memberRole) =>
      memberRole.name.includes('operator'),
    );

    const hasReadAccess = actions.some(
      (action) =>
        action.name === ActionEnum.Read &&
        action.process?.name === ProcessEnum.AssessmentLayer,
    );

    if (!hasReadAccess && isApplicantOrApplicantManager === -1) {
      const teams = await this.assessmentTeamRepository.findAll({
        where: { memberId },
        relations: { assessmentLayer: true },
      });

      if (
        teams.findIndex((team) => team.assessmentLayer!.id === layerId) === -1
      ) {
        throw new NotFoundException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: { property: 'layer' },
          }),
        );
      }
    }

    const layer = await this.assessmentLayerRepository.findOne({
      where: {
        id: layerId,
        assessmentRequest:
          isApplicantOrApplicantManager > -1 &&
          !isAuditor &&
          !isCiso &&
          !isSupervisor &&
          isOperator
            ? [{ applicantId: memberId }, { applicantManagerId: memberId }]
            : undefined,
      },
      relations: {
        assessmentRequest: {
          asset: true,
          requestSpecContents: true,
          testcaseContents: {
            testcaseItem: { testcaseGroup: true },
          },
          environment: true,
        },
        assessmentType: true,
        state: true,
        assessmentTeams: { member: true },
      },
    });

    if (!layer) {
      throw new NotFoundException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'layer' },
        }),
      );
    }

    const requestLayers = await this.assessmentRequestRepository.findOne({
      where: { id: layer.assessmentRequestId },
      relations: {
        assessmentLayers: {
          assessmentType: true,
          state: true,
          assessmentTeams: { member: true },
          assessmentRequest: {
            asset: true,
            requestSpecContents: true,
            testcaseContents: {
              testcaseItem: { testcaseGroup: true },
            },
            environment: true,
          },
        },
        asset: true,
        requestSpecContents: true,
        environment: true,
      },
    });

    if (!requestLayers) {
      throw new NotFoundException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'request' },
        }),
      );
    }

    if (layer.assessmentTeams && layer.assessmentTeams[0]) {
      await userMapperLevel1<AssessmentTeam>(layer.assessmentTeams, 'memberId');
    }

    return { layer, requestLayers: requestLayers.assessmentLayers };
  }

  //------------------------------
  async provideTestCases(layerId: string, member: Member, memberRoles: Role[]) {
    const layer = await this.assessmentLayerRepository.findOne({
      where: { id: layerId },
      relations: {
        assessmentRequest: {
          testcaseContents: {
            testcaseItem: true,
          },
        },
      },
    });

    if (!layer) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'layer' },
        }),
      );
    }

    const layerCurrentStateId = layer.stateId;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { process: layerProcess, action: layerAction } =
        await this.getProcessAndAction(
          ProcessEnum.AssessmentLayer,
          ActionEnum.PendingLayerTestcasesSubmit,
        );

      const stateTransition = await this.stateTransitionService.getNextStatus({
        processId: layerProcess.id,
        actionId: layerAction.id,
        currentStateId: layer.stateId,
      });

      // const comparisonResult = await this.compareLayerTestcases(layerId);
      // if (comparisonResult.isValid) {
      await queryRunner.manager.update(
        AssessmentLayer,
        {
          id: layerId,
        },
        { stateId: stateTransition.id },
      );

      // }
      await queryRunner.commitTransaction();

      await this.actionLogRepository.save({
        action: ActionEnum.PendingLayerTestcasesSubmit,
        userId: member.id,
        roleIds: memberRoles.map((r) => r.id),
        status: ActionLogStatusEnum.SUCCESS,
        assessmentRequestId: layer.assessmentRequestId,
        assessmentLayerId: layer.id,
        assessmentLayerCurrentStateId: layerCurrentStateId,
        assessmentLayerNextStateId: stateTransition.id,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return true;
  }

  //------------------------------
  public async getStateByNameAndProcessName(
    stateName: string,
    processName: string,
  ): Promise<State> {
    const process = await this.processRepository.findOneBy({
      name: processName,
    });
    if (!process) {
      throw new BadRequestException(`Process not found: ${processName}`);
    }

    const state = await this.stateRepository.findOneBy({
      name: stateName,
      processId: process.id,
    });

    if (!state) {
      throw new BadRequestException(
        `State "${stateName}" not found in process "${processName}"`,
      );
    }

    return state;
  }

  //------------------------------
  private async updateRequestIfAllLayersInStates(
    queryRunner: QueryRunner,
    assessmentRequestId: string,
    allowedStateIds: string[],
    targetActionName: string,
  ) {
    const layers = await queryRunner.manager.find(AssessmentLayer, {
      where: { assessmentRequestId },
      select: { stateId: true },
    });

    const allInAllowedStates = layers.every((layer) =>
      allowedStateIds.includes(layer.stateId),
    );

    if (allInAllowedStates) {
      const [process, currentAssessmentRequest] = await Promise.all([
        this.processRepository.findOne({
          where: { name: ProcessEnum.AssessmentRequest },
        }),
        queryRunner.manager.findOne(AssessmentRequest, {
          where: { id: assessmentRequestId },
          select: { stateId: true },
        }),
      ]);

      if (!process || !currentAssessmentRequest) {
        throw new InternalServerErrorException(
          'AssessmentRequest or Process not found',
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
    }
  }

  //------------------------------
  async provideStatusReported(
    layerId: string,
    data: UpdateRequestLayerStatusByActionDto,
    member: Member,
    memberRoles: Role[],
  ) {
    const requestLayer = await this.assessmentLayerRepository.findOne({
      where: { id: layerId },
      relations: { assessmentRequest: true },
    });

    if (!requestLayer || !requestLayer.assessmentRequest) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'layer' },
        }),
      );
    }

    const layerCurrentStateId = requestLayer.stateId;
    const currentRequestState = requestLayer.assessmentRequest?.stateId;

    const { process, action } = await this.getProcessAndAction(
      ProcessEnum.AssessmentLayer,
      data.action,
    );

    const stateTransition = await this.stateTransitionService.getNextStatus({
      processId: process.id,
      actionId: action.id,
      currentStateId: requestLayer.stateId,
    });

    if (!stateTransition) {
      throw new BadRequestException(
        `No valid state transition for action "${data.action}" from state "${requestLayer.stateId}"`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        AssessmentLayer,
        { id: layerId },
        { stateId: stateTransition.id },
      );

      let nextRequestState: string | undefined;
      if (data.action === ActionEnum.LayerAssessmentReviewFinish) {
        nextRequestState = await this.updateRequestIfAllLayersAccepted(
          queryRunner,
          requestLayer.assessmentRequest!,
          stateTransition.id,
          ActionEnum.UnderAnalysisWrapUp,
        );
      } else if (data.action === ActionEnum.LayerAssessmentFulfilledReinstate) {
        const currentRequest = await queryRunner.manager.findOne(
          AssessmentRequest,
          {
            where: { id: requestLayer.assessmentRequestId },
            relations: { state: true },
          },
        );

        if (currentRequest?.state?.name === 'statusReported') {
          const { process, action } = await this.getProcessAndAction(
            ProcessEnum.AssessmentRequest,
            ActionEnum.StatusReportedNeedChanges,
          );

          const stateTransition =
            await this.stateTransitionService.getNextStatus({
              processId: process.id,
              actionId: action.id,
              currentStateId: currentRequest.stateId,
            });

          nextRequestState = stateTransition.id;

          await queryRunner.manager.update(
            AssessmentRequest,
            { id: requestLayer.assessmentRequestId },
            { stateId: stateTransition.id },
          );
        }
      }

      await queryRunner.commitTransaction();

      await this.actionLogRepository.save({
        action: data.action as ActionEnum,
        userId: member.id,
        roleIds: memberRoles.map((r) => r.id),
        status: ActionLogStatusEnum.SUCCESS,
        assessmentRequestId: requestLayer.assessmentRequestId,
        assessmentLayerId: requestLayer.id,
        assessmentLayerCurrentStateId: layerCurrentStateId,
        assessmentLayerNextStateId: stateTransition.id,
        assessmentRequestCurrentStateId: currentRequestState,
        assessmentRequestNextStateId: nextRequestState,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return true;
  }

  //------------------------------
  async updateMultipleLayersByAction(
    data: UpdateMultipleLayersByActionDto,
    member: Member,
    memberRoles: Role[],
  ) {
    const { layerIds } = data;
    const requestLayers = await this.assessmentLayerRepository.findAll({
      where: { id: In(layerIds) },
      relations: { assessmentRequest: true },
    });

    if (!requestLayers || requestLayers.length === 0) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'layer' },
        }),
      );
    }

    const allHaveSameId = requestLayers.every(
      (obj, index, arr) => obj.stateId === arr[0].stateId,
    );

    if (!allHaveSameId) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'state transition' },
        }),
      );
    }

    const { process, action } = await this.getProcessAndAction(
      ProcessEnum.AssessmentLayer,
      data.action,
    );

    const stateTransition = await this.stateTransitionService.getNextStatus({
      processId: process.id,
      actionId: action.id,
      currentStateId: requestLayers[0].stateId,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        AssessmentLayer,
        { id: In(layerIds) },
        { stateId: stateTransition.id },
      );

      let nextRequestState: string | undefined;

      if (data.action === ActionEnum.LayerAssessmentFulfilledReinstate) {
        const currentRequest = await queryRunner.manager.findOne(
          AssessmentRequest,
          {
            where: { id: requestLayers[0].assessmentRequestId },
            relations: { state: true },
          },
        );

        if (currentRequest?.state?.name === 'statusReported') {
          const { process, action } = await this.getProcessAndAction(
            ProcessEnum.AssessmentRequest,
            ActionEnum.StatusReportedNeedChanges,
          );

          const stateTransition =
            await this.stateTransitionService.getNextStatus({
              processId: process.id,
              actionId: action.id,
              currentStateId: currentRequest.stateId,
            });

          nextRequestState = stateTransition.id;

          await queryRunner.manager.update(
            AssessmentRequest,
            { id: requestLayers[0].assessmentRequestId },
            { stateId: stateTransition.id },
          );
        }
      }

      await queryRunner.commitTransaction();

      for (let i = 0; i < requestLayers.length; i++) {
        const requestLayer = requestLayers[i];

        await this.actionLogRepository.save({
          action: data.action as ActionEnum,
          userId: member.id,
          roleIds: memberRoles.map((r) => r.id),
          status: ActionLogStatusEnum.SUCCESS,
          assessmentRequestId: requestLayer.assessmentRequestId,
          assessmentLayerId: requestLayer.id,
          assessmentLayerCurrentStateId: requestLayer.stateId,
          assessmentLayerNextStateId: stateTransition.id,
          assessmentRequestCurrentStateId:
            requestLayer.assessmentRequest?.stateId,
          assessmentRequestNextStateId: nextRequestState,
        });
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return true;
  }

  //------------------------------
  async provideReEvaluationRequested(
    layerId: string,
    data: UpdateRequestLayerStatusByActionDto,
    member: Member,
    memberRoles: Role[],
  ) {
    const requestLayer = await this.assessmentLayerRepository.findOne({
      where: { id: layerId },
      relations: { assessmentRequest: true },
    });

    if (!requestLayer || !requestLayer.assessmentRequest) {
      console.log(`Layer not found with id: ${layerId}`);
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'layer' },
        }),
      );
    }
    const layerCurrentStateId = requestLayer.stateId;
    const currentRequestState = requestLayer.assessmentRequest.stateId;

    const { process, action } = await this.getProcessAndAction(
      ProcessEnum.AssessmentLayer,
      data.action,
    );

    const stateTransition = await this.stateTransitionService.getNextStatus({
      processId: process.id,
      actionId: action.id,
      currentStateId: requestLayer.stateId,
    });

    if (!stateTransition) {
      throw new BadRequestException(
        `No valid transition for action "${data.action}" from state "${requestLayer.stateId}"`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        AssessmentLayer,
        { id: layerId },
        { stateId: stateTransition.id },
      );

      let nextRequestState: string | undefined;

      if (data.action === ActionEnum.LayerReEvaluationRequestedAccept) {
        nextRequestState = await this.updateRequestIfAllLayersAccepted(
          queryRunner,
          requestLayer.assessmentRequest!,
          stateTransition.id,
          ActionEnum.LayerReEvaluationRequestedAccept,
        );
      } else if (data.action === ActionEnum.LayerReEvaluationRequestedReject) {
        const currentRequest = await queryRunner.manager.findOne(
          AssessmentRequest,
          {
            where: { id: requestLayer.assessmentRequestId },
            relations: { state: true },
          },
        );

        if (currentRequest?.state?.name === 'reEvaluationRequested') {
          const { process, action } = await this.getProcessAndAction(
            ProcessEnum.AssessmentRequest,
            ActionEnum.LayerReEvaluationRequestedReject,
          );

          const reqTransition = await this.stateTransitionService.getNextStatus(
            {
              processId: process.id,
              actionId: action.id,
              currentStateId: currentRequest.stateId,
            },
          );

          if (!reqTransition) {
            throw new BadRequestException(
              `Invalid request state transition when rejecting re-evaluation`,
            );
          }

          nextRequestState = reqTransition.id;

          await queryRunner.manager.update(
            AssessmentRequest,
            { id: requestLayer.assessmentRequestId },
            { stateId: reqTransition.id },
          );
        }
      }

      await queryRunner.commitTransaction();

      await this.actionLogRepository.save({
        action: data.action as ActionEnum,
        userId: member.id,
        roleIds: memberRoles.map((r) => r.id),
        status: ActionLogStatusEnum.SUCCESS,
        assessmentRequestId: requestLayer.assessmentRequestId,
        assessmentLayerId: requestLayer.id,
        assessmentLayerCurrentStateId: layerCurrentStateId,
        assessmentLayerNextStateId: stateTransition.id,
        assessmentRequestCurrentStateId: currentRequestState,
        assessmentRequestNextStateId: nextRequestState,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return true;
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
    assessmentRequest: AssessmentRequest,
    expectedStateId: string,
    targetActionName: string,
    nextActions?: ActionEnum[],
  ) {
    const layers = await queryRunner.manager.find(AssessmentLayer, {
      where: { assessmentRequestId: assessmentRequest.id },
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

    const allAccepted = layers.every((layer) =>
      expectedStateIds.includes(layer.stateId),
    );

    if (allAccepted) {
      const process = await this.processRepository.findOne({
        where: { name: ProcessEnum.AssessmentRequest },
      });

      if (!process) {
        throw new InternalServerErrorException(
          `Process not found: ${ProcessEnum.AssessmentRequest}`,
        );
      }

      if (!assessmentRequest) {
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
        currentStateId: assessmentRequest.stateId,
      });

      await queryRunner.manager.update(
        AssessmentRequest,
        { id: assessmentRequest.id },
        { stateId: nextRequestState.id },
      );

      return nextRequestState.id;
    }

    return undefined;
  }

  //------------------------------
  /**
   * Compares the `TestcaseContent` records of an AssessmentLayer’s request
   * against the required `TestcaseItem`s defined by the AssessmentType
   * of that same layer.
   *
   * This method ensures that:
   * - All non-optional TestcaseItems (`isOptional = false`) belonging to
   *   the layer’s AssessmentType are covered by a TestcaseContent.
   * - Detects any TestcaseContents in the request that do not belong
   *   to the current layer’s required TestcaseItems.
   *
   * @param layerId - The unique identifier of the AssessmentLayer
   *
   * @returns An object containing:
   * - `missingTestcases`: List of required TestcaseItems not found in contents
   * - `extraTestcases`: List of TestcaseContents that don’t belong to required items
   * - `isValid`: Boolean flag, true if all required TestcaseItems are covered
   *
   * @throws {NotFoundException} if the AssessmentLayer is not found
   *
   * @example
   * const result = await service.compareLayerTestcases('layer-uuid');
   * if (!result.isValid) {
   *   console.log('Missing:', result.missingTestcases);
   * }
   */
  async compareLayerTestcases(layerId: string): Promise<{
    missingTestcases: TestcaseItem[];
    extraTestcases: TestcaseContent[];
    isValid: boolean;
  }> {
    const layer = await this.assessmentLayerRepository.findOne({
      where: { id: layerId },
      relations: [
        'assessmentRequest',
        'assessmentRequest.testcaseContents',
        'assessmentRequest.testcaseContents.testcaseItem',
        'assessmentType',
        'assessmentType.testcaseGroups',
        'assessmentType.testcaseGroups.testcaseItems',
      ],
    });

    if (!layer) {
      throw new NotFoundException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'Assessment Layer' },
        }),
      );
    }

    const requestContents = layer.assessmentRequest?.testcaseContents ?? [];

    const requiredItems =
      layer.assessmentType?.testcaseGroups
        ?.flatMap((group) => group.testcaseItems ?? [])
        ?.filter((item) => !item.isOptional) ?? [];

    const { missing, extra } = this.compareTestcases(
      requestContents,
      requiredItems,
    );

    return {
      missingTestcases: missing,
      extraTestcases: extra,
      isValid: missing.length === 0,
    };
  }

  //------------------------------
  /**
   * Helper method to compare TestcaseContents against a required set of TestcaseItems.
   *
   * Rules:
   * - A TestcaseItem is "missing" if no TestcaseContent exists for its ID.
   * - A TestcaseContent is "extra" if it belongs to a TestcaseItem that is not required.
   *
   * This function is designed to be reusable for different levels
   * (AssessmentRequest-wide, or per AssessmentLayer).
   *
   * @param contents - The list of TestcaseContents provided in the request
   * @param requiredItems - The list of required TestcaseItems to validate against
   *
   * @returns An object containing:
   * - `missing`: List of TestcaseItems not present in contents
   * - `extra`: List of TestcaseContents not mapping to required items
   *
   * @example
   * const { missing, extra } = service.compareTestcases(contents, requiredItems);
   * if (missing.length > 0) {
   *   throw new Error('Some testcases are missing!');
   * }
   */
  private compareTestcases(
    contents: TestcaseContent[],
    requiredItems: TestcaseItem[],
  ): { missing: TestcaseItem[]; extra: TestcaseContent[] } {
    const contentItemIds = new Set(contents.map((c) => c.testcaseItemId));

    const missing = requiredItems.filter(
      (item) => !contentItemIds.has(item.id),
    );

    const requiredIds = new Set(requiredItems.map((i) => i.id));
    const extra = contents.filter(
      (c) => c.testcaseItemId && !requiredIds.has(c.testcaseItemId),
    );

    return { missing, extra };
  }
}
