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
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { ModifyPatchRequestBodyInterceptors } from 'src/common/interceptors/modify-patch-request-body.interceptor';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { CreateEnvironmentDto } from '../dto/input/create-environment.dto';
import { UpdateEnvironmentDto } from '../dto/input/update-environment.dto';
import { GetEnvironmentDto } from '../dto/response/get-environment.dto';
import { EnvironmentService } from '../services/environment.service';

@Controller()
export class EnvironmentController {
  constructor(private readonly environmentService: EnvironmentService) {}

  //------------------------------
  @ApiTags('Admin / Environment')
  @ApiOperation({ summary: 'Create Environment' })
  @ApiCreatedResponse({
    type: GetEnvironmentDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Post('admin/environment')
  async create(@Body() data: CreateEnvironmentDto): Promise<GetEnvironmentDto> {
    const result = await this.environmentService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Environment')
  @ApiOperation({ summary: 'Get All Environment' })
  @ApiCreatedResponse({
    type: GetEnvironmentDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Get('admin/environment')
  async findAll(@Query() query: PaginationDto) {
    const data = await this.environmentService.findAllPagination(
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
  @ApiTags('Admin / Environment')
  @ApiOperation({ summary: 'Get One Environment' })
  @ApiCreatedResponse({
    type: GetEnvironmentDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Get('admin/environment/:id')
  async findOne(@Param('id') id: string): Promise<GetEnvironmentDto> {
    const result = await this.environmentService.findOne({ where: { id } });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Environment')
  @ApiOperation({ summary: 'Update Environment' })
  @ApiCreatedResponse({
    type: GetEnvironmentDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @UseGuards(AdminGuard)
  @Patch('admin/environment/:id')
  async update(@Param('id') id: string, @Body() data: UpdateEnvironmentDto) {
    const result = await this.environmentService.update({ id }, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  //----------------------------------
  @ApiTags('Admin / Environment')
  @ApiOperation({ summary: 'Remove Environment by ID' })
  @ApiCreatedResponse({
    type: GetEnvironmentDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Delete('admin/environment/:id')
  remove(@Param('id') id: string) {
    return this.environmentService.remove(id);
  }

  //------------------------------
  @ApiTags('Environment')
  @ApiOperation({ summary: 'Get All Environment' })
  @ApiCreatedResponse({
    type: GetEnvironmentDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('environment')
  async findAllUserScope(@Query() query: PaginationDto) {
    const data = await this.environmentService.findAllPagination(
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
