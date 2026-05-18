import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Action } from 'src/common/decorators/action.decorator';
import { Process } from 'src/common/decorators/process.decorator';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { CreateAssetRelationDto } from '../dto/input/create-asset-relation.dto';
import { AssetRelationService } from '../services/asset-relation.service';

@ApiTags('Asset-Relation')
@Controller('asset-relation')
export class AssetRelationController {
  constructor(private readonly assetRelationService: AssetRelationService) {}

  //------------------------------
  @ApiOperation({ summary: 'Create Asset Relation' })
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Save)
  @Process(ProcessEnum.AssetManagement)
  @Post('')
  async create(@Body() data: CreateAssetRelationDto) {
    const result = await this.assetRelationService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }
}
