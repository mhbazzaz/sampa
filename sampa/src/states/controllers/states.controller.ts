import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @UseGuards(UserGuard)
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
