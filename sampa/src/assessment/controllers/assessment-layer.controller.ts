import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentMemberRoles } from 'src/common/decorators/current-member-roles.decorators';
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { Member } from 'src/member/entities/member.entity';
import { Role } from 'src/role/entities/role.entity';
import { StateTransition } from 'src/state-transition/entities/state-transition.entity';
import { FindAllAssessmentLayersQueryDto } from '../dto/input/find-all-assessment-layers-query.dto';
import { UpdateAssessmentLayerAuditorsDto } from '../dto/input/update-assessment-layer-add-auditors.dto';
import { UpdateAssessmentLayerAddSAMsDto } from '../dto/input/update-assessment-layer-add-sam.dto';
import { UpdateAssessmentLayerAddSupervisorsDto } from '../dto/input/update-assessment-layer-add-supervisors.dto';
import { UpdateRequestLayerStatusByActionDto } from '../dto/input/update-request-layer-status-by-action.dto';
import { UpdateMultipleLayersByActionDto } from '../dto/input/update-request-layers-action.dto';
import { AssessmentLayerService } from '../services/assessment-layer.service';

@ApiTags('Assessment-Layer')
@Controller('assessment-layer')
export class AssessmentLayerController {
  constructor(
    private readonly assessmentLayerService: AssessmentLayerService,
  ) {}

  //------------------------------
  @ApiOperation({
    summary: `Assign Supervisor To Layer, ${ActionEnum.SAMAssignedAddSupervise}, ${ActionEnum.SupervisedAssignSupervisor} | ${ProcessEnum.AssessmentLayer}`,
  })
  @ApiCreatedResponse({
    type: StateTransition,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.SAMAssignedAddSupervise,
    ActionEnum.SupervisedAssignSupervisor,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Patch('add-supervisor')
  async addSupervisor(
    @Body() data: UpdateAssessmentLayerAddSupervisorsDto,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    await this.assessmentLayerService.addSupervisor(data, member, memberRoles);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
    });
  }

  //------------------------------
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.ApprovedAssignSAM,
    ActionEnum.SAMAssignedAssignSAM,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Patch('add-sam')
  async addSAM(
    @Body() data: UpdateAssessmentLayerAddSAMsDto,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    await this.assessmentLayerService.addSAM(data, member, memberRoles);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Get Cartable, ${ActionEnum.ReadMine} ${ActionEnum.ReadForTeam} | ${ProcessEnum.AssessmentRequest}`,
  })
  @ApiCreatedResponse({
    type: StateTransition,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.SupervisedAssignAllTeamsAuditors,
    ActionEnum.SupervisedAssignOwnTeamAuditors,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Patch('add-auditors')
  async addAuditors(
    @Body() data: UpdateAssessmentLayerAuditorsDto,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() roles: Role[],
  ) {
    await this.assessmentLayerService.addAuditors(data, member, roles);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Get Cartable, ${ActionEnum.ReadForTeam} ${ActionEnum.ReadMine} | ${ProcessEnum.AssessmentLayer}`,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.ReadForTeam,
    ActionEnum.ReadMine,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Get('cartable')
  async cartable(
    @Query() query: PaginationDto,
    @CurrentMemberRoles() memberRoles: Role[],
    @CurrentMember() member: Member,
  ) {
    const result = await this.assessmentLayerService.cartable(
      query.skip,
      query.take,
      memberRoles,
      member.id,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result?.result, count: result?.count },
    });
  }

  //------------------------------
  // @UseGuards(AuthorizationGuard)
  // @UseGuards(UserGuard)
  // @SetMetadata(AuthorizationMetaDataEnum.Action, [
  //   ActionEnum.OnboardingFinalizeSpecs,
  // ])
  // @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  // @Patch('update-request-layer-status-by-action-my-team/:id')
  // async updateStatusByActionMyTeam(
  //   @Param('id') layerId: string,
  //   @Body() data: UpdateRequestLayerStatusByActionDto,
  //   @CurrentMember() member: Member,
  //   @CurrentMemberRoles() memberRoles: Role[],
  // ) {
  //   await this.assessmentLayerService.updateAssessmentLayerStatusByActionMyTeam(
  //     layerId,
  //     data,
  //     member.id,
  //     memberRoles,
  //   );
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //   });
  // }

  //------------------------------
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.OnboardingFinalizeSpecs,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Patch('request-layer-finalize-spec/:id')
  async updateStatusByActionMyTeam(
    @Param('id') layerId: string,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    await this.assessmentLayerService.assessmentLayerFinalizeSpec(
      layerId,
      member.id,
      memberRoles,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Get Cartable, ${ActionEnum.ReadMine} ${ActionEnum.ReadForTeam} | ${ProcessEnum.AssessmentRequest}`,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.ReadMine,
    ActionEnum.Read,
    ActionEnum.ReadForTeam,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Get(':id')
  async getOneAssessmentLayer(
    @Param('id') layerId: string,
    @CurrentMemberRoles() memberRoles: Role[],
    @CurrentMember() member: Member,
  ) {
    const result = await this.assessmentLayerService.getOneAssessmentLayer(
      layerId,
      memberRoles,
      member.id,
    );

    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [ActionEnum.ReadLayersForTeam])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Get('')
  async getUsersTeamRequestsLayers(
    @CurrentMember() member: Member,
    @Query() query: FindAllAssessmentLayersQueryDto,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    const result = await this.assessmentLayerService.getUsersLayers(
      query,
      member,
      memberRoles,
    );

    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Update One Assessment Layer status by action, ${ActionEnum.PendingLayerTestcasesSubmit} | ${ProcessEnum.AssessmentLayer}`,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.PendingLayerTestcasesSubmit,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Patch('provide-test-case/:id')
  async provideTestCases(
    @Param('id') layerId: string,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    await this.assessmentLayerService.provideTestCases(
      layerId,
      member,
      memberRoles,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
    });
  }

  //------------------------------
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.LayerAssessmentReviewFinish,
    ActionEnum.LayerAssessmentReviewNeedModifications,
    ActionEnum.LayerAssessmentReviewAccept,
    ActionEnum.LayerAssessmentCompletedAccept,
    ActionEnum.LayerAssessmentCompletedFeedback,
    ActionEnum.LayerReportIssuedRemark,
    ActionEnum.LayerReportIssuedRefer,
    ActionEnum.RemediateLayerVulnerabilitiesDecline,
    ActionEnum.RemediateLayerVulnerabilitiesFinalize,
    ActionEnum.ReviewLayerRemediatesReject,
    ActionEnum.ReviewLayerRemediatesApprove,
    ActionEnum.LayerReEvaluationRequestedReject,
    ActionEnum.LayerReEvaluationRequestedAccept,
    ActionEnum.LayerAssessmentFulfilledReinstate,
    ActionEnum.LayerAssessmentReviewAcceptBySAM,
    ActionEnum.LayerAssessmentReviewNeedModificationsBySAM,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Patch('provide-status-reported/:id')
  async provideStatusReported(
    @Param('id') layerId: string,
    @Body() data: UpdateRequestLayerStatusByActionDto,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    await this.assessmentLayerService.provideStatusReported(
      layerId,
      data,
      member,
      memberRoles,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
    });
  }

  //------------------------------
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.LayerAssessmentFulfilledReinstate,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Patch('update-multiple-layers-by-action')
  async updateMultipleLayersByAction(
    @Body() data: UpdateMultipleLayersByActionDto,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    await this.assessmentLayerService.updateMultipleLayersByAction(
      data,
      member,
      memberRoles,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Update One Assessment Layer status by action, ${ActionEnum.LayerReEvaluationRequestedAccept} ${ActionEnum.LayerReEvaluationRequestedReject} | ${ProcessEnum.AssessmentLayer}`,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.LayerReEvaluationRequestedAccept,
    ActionEnum.LayerReEvaluationRequestedReject,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Patch('provide-re-evaluation-requested/:id')
  async provideReEvaluationRequested(
    @Param('id') layerId: string,
    @Body() data: UpdateRequestLayerStatusByActionDto,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    await this.assessmentLayerService.provideReEvaluationRequested(
      layerId,
      data,
      member,
      memberRoles,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
    });
  }
}
