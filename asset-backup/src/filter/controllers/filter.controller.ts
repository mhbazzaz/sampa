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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Action } from 'src/common/decorators/action.decorator';
import { Process } from 'src/common/decorators/process.decorator';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { CreateFilterDto } from '../dto/input/create-filter.dto';
import { FindAllFilterUserScopeQueryDto } from '../dto/input/find-all-filter-user-scope-query.dto';
import { UpdateFilterDto } from '../dto/input/update-filter.dto';
import { GetFilterDto } from '../dto/response/get-filter.dto';
import { FilterService } from '../services/filter.service';

@Controller('')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  //------------------------------
  @ApiOperation({ summary: 'Create Filter' })
  @ApiCreatedResponse({
    type: GetFilterDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Filter')
  @Post('admin/filter')
  async create(@Body() data: CreateFilterDto): Promise<GetFilterDto> {
    const result = await this.filterService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Filter' })
  @ApiCreatedResponse({
    type: GetFilterDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Filter')
  @Get('admin/filter')
  async findAll(@Query() query: PaginationDto) {
    const data = await this.filterService.findAllPagination(
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
  @ApiOperation({ summary: 'Get One Filter' })
  @ApiCreatedResponse({
    type: GetFilterDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Filter')
  @Get('admin/filter/:id')
  async findOne(@Param('id') id: string): Promise<GetFilterDto> {
    const result = await this.filterService.findOneAdminScope(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Update Filter' })
  @ApiCreatedResponse({
    type: GetFilterDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Filter')
  @Patch('admin/filter/:id')
  async update(@Param('id') id: string, @Body() data: UpdateFilterDto) {
    const result = await this.filterService.update(id, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  //----------------------------------
  @ApiOperation({ summary: 'Remove Filter by ID' })
  @ApiCreatedResponse({
    type: GetFilterDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Filter')
  @Delete('admin/filter/:id')
  async remove(@Param('id') id: string) {
    return await this.filterService.remove(id);
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Filter' })
  @ApiCreatedResponse({
    type: GetFilterDto,
  })
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiTags('Asset-Filter')
  @Get('filter')
  async findAllUserScope(@Query() query: FindAllFilterUserScopeQueryDto) {
    const data = await this.filterService.findAllUserScope(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }
}
