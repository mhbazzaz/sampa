import { Controller, Get, Query, SetMetadata, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { GetStatesDto } from '../dto/get-states-response.dto';
import { FindAllStatesQueryDto } from '../dto/input/get-all-states-query-params.dto';
import { StatesService } from '../services/states.service';

@ApiTags('States')
@Controller('states')
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  //------------------------------
  @ApiOperation({ summary: 'Get All States For User Scope' })
  @ApiCreatedResponse({
    type: GetStatesDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.Read,
    ActionEnum.ReadForTeam,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get('')
  async findAllUserScope(@Query() query: FindAllStatesQueryDto) {
    const data = await this.statesService.findAll(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: data,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All States For User Scope' })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('ordered')
  async findAllStatesOrdered() {
    const data = await this.statesService.findAllOrdered();
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: data,
    });
  }
}
