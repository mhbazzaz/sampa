import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Action } from 'src/common/decorators/action.decorator';
import { Process } from 'src/common/decorators/process.decorator';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { ActionLogService } from '../services/action-log.service';

@ApiTags('Action Log')
@Controller('action-log')
export class ActionLogController {
  constructor(private readonly actionLogService: ActionLogService) {}

  //------------------------------
  @ApiOperation({ summary: 'Get Detailed Action Logs For Specific Asset' })
  @ApiBearerAuth('accessToken')
  @UseGuards(UserGuard, AuthorizationGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get(':assetId')
  async getDetailedLogs(@Param('assetId') assetId: string) {
    const result = await this.actionLogService.getDetailedLogs(assetId);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }
}
