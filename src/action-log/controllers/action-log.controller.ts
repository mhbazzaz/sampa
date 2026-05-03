import {
  Controller,
  Get,
  Param,
  Query,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { GetActionLogQueryDto } from '../dto/input/get-action-log-query.dto';
import { ActionLogService } from '../services/action-log.service';

@ApiTags('Action Log')
@Controller('action-log')
export class ActionLogController {
  constructor(private readonly actionLogService: ActionLogService) {}

  //------------------------------
  @ApiOperation({ summary: 'Get Detailed Action Logs For Specific Asset' })
  @ApiBearerAuth('accessToken')
  @UseGuards(UserGuard, AuthorizationGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, ActionEnum.ReadActionLog)
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get('/assessment-request/:assessmentRequestId')
  async getDetailedLogs(
    @Param('assessmentRequestId') assessmentRequestId: string,
    @Query() query: GetActionLogQueryDto,
  ) {
    const result = await this.actionLogService.getDetailedLogs(
      assessmentRequestId,
      query,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }
}
