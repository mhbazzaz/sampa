import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { StateTransition } from '../entities/state-transition.entity';
import { StateTransitionService } from '../services/state-transition.service';

@Controller('')
@ApiTags('State-Transition')
export class StateTransitionController {
  constructor(
    private readonly stateTransitionService: StateTransitionService,
  ) {}

  //------------------------------
  @ApiOperation({ summary: 'Get State transition' })
  @ApiCreatedResponse({
    type: [StateTransition],
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('/state-transitions')
  async findAll() {
    const data = await this.stateTransitionService.findAll();

    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: data,
    });
  }
}
