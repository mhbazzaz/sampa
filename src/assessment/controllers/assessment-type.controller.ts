import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { GetAssessmentDto } from '../dto/response/get-assessment.dto';
import { AssessmentTypeService } from '../services/assessment-type.service';

@Controller()
export class AssessmentTypeController {
  constructor(private readonly assessmentTypeService: AssessmentTypeService) {}

  //------------------------------
  @ApiTags('Admin / Assessment-Type')
  @ApiOperation({ summary: 'Get All Assessment Type' })
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Get('admin/assessment-type')
  async findAllAdminScope(@Query() query: PaginationDto) {
    const data = await this.assessmentTypeService.findAllPaginationAdminScope(
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
  @ApiTags('Assessment-Type')
  @ApiOperation({ summary: 'Get All Assessment Type' })
  @ApiCreatedResponse({
    type: GetAssessmentDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('assessment-type')
  async findAll(@Query() query: PaginationDto) {
    const data = await this.assessmentTypeService.findAllPagination(
      query.skip,
      query.take,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }
}
