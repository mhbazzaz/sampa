import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { CreateAssessmentTeamDto } from '../dto/input/create-assessment-team.dto';
import { UpdateAssessmentTeamDto } from '../dto/input/update-assessment-team.dto';
import { GetAssessmentDto } from '../dto/response/get-assessment.dto';
import { AssessmentTeamService } from '../services/assessment-team.service';

@ApiTags('Assessment-Team')
@Controller('assessment-team')
export class AssessmentTeamController {
  constructor(private readonly assessmentTeamService: AssessmentTeamService) {}

  //------------------------------
  @ApiOperation({ summary: 'Create Assessment Type' })
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
  @UseGuards(UserGuard)
  @Post('')
  async create(
    @Body() data: CreateAssessmentTeamDto,
  ): Promise<GetAssessmentDto> {
    const result = await this.assessmentTeamService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Assessment Type' })
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
  @UseGuards(UserGuard)
  @Get('')
  async findAll(@Query() query: PaginationDto) {
    const data = await this.assessmentTeamService.findAllPagination(
      query.skip,
      query.take,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Assessment Type' })
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
  @UseGuards(UserGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GetAssessmentDto> {
    const result = await this.assessmentTeamService.findOne({ where: { id } });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Update Assessment Type' })
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
  @UseGuards(UserGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateAssessmentTeamDto) {
    const result = await this.assessmentTeamService.update({ id }, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  //----------------------------------
  @ApiOperation({ summary: 'Remove Assessment Type by ID' })
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
  @UseGuards(UserGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assessmentTeamService.remove({ id });
  }
}
