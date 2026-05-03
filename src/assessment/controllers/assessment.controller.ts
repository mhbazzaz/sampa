import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentMemberRoles } from 'src/common/decorators/current-member-roles.decorators';
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { GetCartableDto } from 'src/common/pagination-dto/get-cartable.dto';
import { IsUUIDPipe } from 'src/common/pipes/parse-uuid.pipe';
import { Member } from 'src/member/entities/member.entity';
import { Role } from 'src/role/entities/role.entity';
import { CreateAssessmentRequestDto } from '../dto/input/create-assessment-request.dto';
import { FindAllAssessmentQueryDto } from '../dto/input/find-all-assessment-request-query.dto';
import { RequestClosureDto } from '../dto/input/request-closure.dto';
import { UpdateRequestStatusByActionDto } from '../dto/input/update-request-status-by-action.dto';
import { UpdateRequestDto } from '../dto/input/update-request.dto';
import { GetAssessmentDto } from '../dto/response/get-assessment.dto';
import { AssessmentRequestService } from '../services/assessment-request.service';

@Controller()
export class AssessmentController {
  constructor(
    private readonly assessmentRequestService: AssessmentRequestService,
  ) {}

  //------------------------------
  @ApiTags('Assessment')
  @ApiOperation({
    summary: `Create New Assessment Request, ${ActionEnum.InitiatedRegister} ${ActionEnum.DraftRegister} | ${ProcessEnum.AssessmentRequest}`,
  })
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.InitiatedRegister,
    ActionEnum.DraftRegister,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Post('assessment/new-request')
  async create(
    @Body() data: CreateAssessmentRequestDto,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ): Promise<GetAssessmentDto> {
    const result = await this.assessmentRequestService.createAssessmentRequest(
      data,
      member,
      memberRoles,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Assessment')
  @ApiOperation({ summary: 'Update One Assessment Request' })
  @ApiOperation({
    summary: `Create New Assessment Request, ${ActionEnum.DraftModify}, ${ActionEnum.ApprovedModify}, ${ActionEnum.SubmittedModify} | ${ProcessEnum.AssessmentRequest}`,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.DraftModify,
    ActionEnum.ApprovedModify,
    ActionEnum.SubmittedModify,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Patch('assessment/requests/:id')
  async update(
    @Param('id') requestId: string,
    @Body() data: UpdateRequestDto,
  ): Promise<GetAssessmentDto> {
    const result = await this.assessmentRequestService.updateAssessmentRequest(
      requestId,
      data,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Assessment')
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.SubmittedApprove,
    ActionEnum.InitiatedRegister,
    ActionEnum.DraftRegister,
    ActionEnum.SubmittedDecline,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Patch('assessment/update-request-status-by-action-my-team/:id')
  async updateStatusByActionMyTeam(
    @Param('id') requestId: string,
    @Body() data: UpdateRequestStatusByActionDto,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    await this.assessmentRequestService.updateAssessmentRequestStatusByActionMyTeam(
      requestId,
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
  @ApiTags('Assessment')
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.SubmittedDecline,
    ActionEnum.PreEvaluationReject,
    ActionEnum.ApprovedAccept,
    ActionEnum.ApprovedDisapprove,
    ActionEnum.ClosedReopen,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Patch('assessment/update-request-status-by-action/:id')
  async updateStatusByAction(
    @Param('id') requestId: string,
    @Body() data: UpdateRequestStatusByActionDto,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    await this.assessmentRequestService.updateAssessmentRequestStatusByAction(
      requestId,
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
  @ApiTags('Assessment')
  @ApiOperation({
    summary: `Update One Assessment Request status by action, ${ActionEnum.AwaitingSpecsProvideSpecs} | ${ProcessEnum.AssessmentRequest}`,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.AwaitingSpecsProvideSpecs,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Patch('assessment/provide-spec/:id')
  async provideSpecs(
    @Param('id') requestId: string,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    await this.assessmentRequestService.provideSpecs(
      requestId,
      member,
      memberRoles,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
    });
  }

  //------------------------------
  @ApiTags('Assessment')
  @ApiOperation({
    summary: `Get One Assessment Request, ${ActionEnum.ReadForTeam} ${ActionEnum.Read} | ${ProcessEnum.AssessmentRequest}`,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.ReadForTeam,
    ActionEnum.Read,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get('assessment')
  async getUsersTeamRequests(
    @CurrentMember() member: Member,
    @Query() query: FindAllAssessmentQueryDto,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    const result = await this.assessmentRequestService.getUsersRequests(
      query,
      member.id,
      memberRoles ? memberRoles.map((role) => role.id) : [],
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Assessment')
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Get('assessment/cartable')
  async cartable(
    @Query() query: GetCartableDto,
    @CurrentMemberRoles() memberRoles: Role[],
    @CurrentMember() member: Member,
  ) {
    const data = await this.assessmentRequestService.cartable(
      query,
      memberRoles.map((role) => role.id),
      member,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data,
    });
  }

  //------------------------------
  @ApiTags('Assessment')
  @ApiOperation({ summary: 'Get Assessment Request By ID' })
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.ReadForTeam,
    ActionEnum.Read,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get('assessment/:id')
  async findOne(
    @Param('id', IsUUIDPipe) id: string,
    @CurrentMemberRoles() memberRoles: Role[],
    @CurrentMember() member: Member,
  ): Promise<GetAssessmentDto> {
    const result = await this.assessmentRequestService.getOneInfo({
      id,
      memberRoles: memberRoles ? memberRoles.map((role) => role.id) : [],
      memberId: member.id,
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Assessment')
  @ApiOperation({ summary: 'Get Assessment Request By ID' })
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.ReadVulnerabilityCount,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get('assessment/:id/vulnerability-count')
  async getAssessmentVulnerabilityCount(
    @Param('id', IsUUIDPipe) id: string,
    @CurrentMemberRoles() memberRoles: Role[],
    @CurrentMember() member: Member,
  ): Promise<GetAssessmentDto> {
    const result =
      await this.assessmentRequestService.getAssessmentVulnerabilityCount({
        id,
        memberRoles: memberRoles,
        memberId: member.id,
      });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Assessment')
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.StatusReportedFinalize,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Post('assessment/:id/request-closure')
  async requestClosure(
    @Param('id', IsUUIDPipe) id: string,
    @Body() data: RequestClosureDto,
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ): Promise<GetAssessmentDto> {
    const result = await this.assessmentRequestService.requestClosure(
      id,
      data,
      member,
      memberRoles,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }
}
