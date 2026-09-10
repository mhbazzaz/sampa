import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
  Res,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentMemberRoles } from 'src/common/decorators/current-member-roles.decorators';
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ExportFormatEnum } from 'src/common/enums/export-format.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { GetCartableDto } from 'src/common/pagination-dto/get-cartable.dto';
import { IsUUIDPipe } from 'src/common/pipes/parse-uuid.pipe';
import { Member } from 'src/member/entities/member.entity';
import { Role } from 'src/role/entities/role.entity';
import { AssessmentReportFilterWithoutPaginateDto } from '../dto/input/assessment-report-filter-without-paginate.dto';
import { AssessmentReportFilterDto } from '../dto/input/assessment-report-filter.dto';
import { CreateAssessmentRequestDto } from '../dto/input/create-assessment-request.dto';
import { FindAccessibleNotificationsQueryDto } from '../dto/input/find-accessible-notifications.dto';
import { FindAllAssessmentQueryDto } from '../dto/input/find-all-assessment-request-query.dto';
import { RemainedVulnerabilityReportFilterDto } from '../dto/input/remained-vulnerability-report-filter.dto';
import { RequestClosureDto } from '../dto/input/request-closure.dto';
import { UpdateRequestStatusByActionDto } from '../dto/input/update-request-status-by-action.dto';
import { UpdateRequestDto } from '../dto/input/update-request.dto';
import { GetAssessmentDto } from '../dto/response/get-assessment.dto';
import { AccessibleNotificationsService } from '../services/accessible-notifications.service';
import { AssessmentRequestService } from '../services/assessment-request.service';
import { RemainedVulnerabilityReportService } from '../services/remained-vulnerability-report.service';

@Controller()
export class AssessmentController {
  constructor(
    private readonly assessmentRequestService: AssessmentRequestService,
    private readonly remainedVulnerabilityReportService: RemainedVulnerabilityReportService,
    private readonly accessibleNotificationsService: AccessibleNotificationsService,
  ) {}

  //------------------------------
  @ApiTags('Assessment')
  @ApiOperation({
    summary: `Create New Assessment Request, ${ActionEnum.InitiatedRegister} ${ActionEnum.DraftRegister} | ${ProcessEnum.AssessmentRequest}`,
  })
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
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
    @CurrentMember() currentMember: Member,
    @CurrentMemberRoles() memberRoles: Role[],
  ): Promise<GetAssessmentDto> {
    const result = await this.assessmentRequestService.updateAssessmentRequest(
      requestId,
      data,
      currentMember,
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
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.SubmittedDecline,
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
  // @ApiTags('Assessment')
  // @UseGuards(AuthorizationGuard)
  // @UseGuards(UserGuard)
  // @SetMetadata(AuthorizationMetaDataEnum.Action, [
  //   ActionEnum.AwaitingSpecsProvideSpecs,
  // ])
  // @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  // @Patch('assessment/provide-spec/:id')
  // async provideSpecs(
  //   @Param('id') requestId: string,
  //   @CurrentMember() member: Member,
  //   @CurrentMemberRoles() memberRoles: Role[],
  // ) {
  //   await this.assessmentRequestService.provideSpecs(
  //     requestId,
  //     member,
  //     memberRoles,
  //   );
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //   });
  // }

  //------------------------------
  @ApiTags('Assessment')
  @ApiOperation({
    summary: `Get One Assessment Request, ${ActionEnum.ReadForTeam} ${ActionEnum.Read} | ${ProcessEnum.AssessmentRequest}`,
  })
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
  @ApiTags('Assessment')
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
      memberRoles,
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
  @ApiOperation({
    summary:
      'Get notifications of accessible assessment requests and layers (Ringbell)',
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.ReadForTeam,
    ActionEnum.Read,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get('assessment/accessible/notifications')
  async getAccessibleNotifications(
    @CurrentMember() member: Member,
    @CurrentMemberRoles() memberRoles: Role[],
    @Query() query: FindAccessibleNotificationsQueryDto,
  ) {
    const result =
      await this.accessibleNotificationsService.getAccessibleNotifications(
        member,
        memberRoles,
        query,
      );

    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Assessment')
  @ApiOperation({
    summary: 'Get Assessment Reports',
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [ActionEnum.Read])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get('assessment/reports')
  async getAssessmentReports(
    @Query() filters: AssessmentReportFilterDto,
  ): Promise<GetAssessmentDto> {
    const result =
      await this.assessmentRequestService.getAssessmentReports(filters);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Assessment')
  @ApiOperation({
    summary:
      'Remained vulnerability report. Unfiltered: totals + deputies. Any filter: also assets. Org is deputy > management > group.',
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [ActionEnum.Read])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get('assessment/reports/remained-vulnerabilities')
  async getRemainedVulnerabilityReport(
    @Query() filters: RemainedVulnerabilityReportFilterDto,
  ) {
    const result =
      await this.remainedVulnerabilityReportService.getReport(filters);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Assessment')
  @ApiOperation({
    summary: 'Export Assessment Reports',
  })
  @ApiQuery({ name: 'format', enum: ExportFormatEnum, required: false })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [ActionEnum.Read])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get('assessment/reports/export')
  async exportAssessmentReports(
    @Query() filters: AssessmentReportFilterWithoutPaginateDto,
    @Query('format', new ParseEnumPipe(ExportFormatEnum, { optional: true }))
    format: ExportFormatEnum = ExportFormatEnum.EXCEL,
    @Res() res: Response,
  ) {
    const fileBuffer =
      await this.assessmentRequestService.exportAssessmentReports(
        filters,
        format,
      );

    if (format === ExportFormatEnum.EXCEL) {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=assessment-reports.xlsx',
      );
      return res.send(fileBuffer);
    } else if (format === ExportFormatEnum.CSV) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=assessment-reports.csv',
      );
      return res.send(fileBuffer);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=assessment-reports.json',
      );
      return res.send(fileBuffer);
    }
  }

  //------------------------------
  @ApiTags('Assessment')
  @ApiOperation({ summary: 'Get Assessment Request By ID' })
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
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
      memberRoles,
      member,
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
        member,
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
