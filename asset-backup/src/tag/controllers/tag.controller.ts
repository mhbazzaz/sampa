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
import { Action } from 'src/common/decorators/action.decorator';
import { Process } from 'src/common/decorators/process.decorator';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { ModifyPatchRequestBodyInterceptors } from 'src/common/interceptors/modify-patch-request-body.interceptor';
import { CreateTagDto } from '../dto/input/create-tag.dto';
import { GetAssetsQueryParamsDto } from '../dto/input/get-tag-query-params.dto';
import { PaginationGetTagDto } from '../dto/input/pagination-get-tag.dto';
import { UpdateTagDto } from '../dto/input/update-tag.dto';
import { GetTagDto } from '../dto/response/get-tag.dto';
import { TagService } from '../services/tag.service';

@Controller('')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  //------------------------------
  @ApiTags('Admin / Tag')
  @ApiOperation({ summary: 'Create Tag' })
  @ApiCreatedResponse({
    type: GetTagDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Post('admin/tag')
  async create(@Body() data: CreateTagDto): Promise<GetTagDto> {
    const result = await this.tagService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Tag')
  @ApiOperation({ summary: 'Get All Tags' })
  @ApiCreatedResponse({
    type: GetTagDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Get('admin/tag')
  async findAll(@Query() query: GetAssetsQueryParamsDto) {
    const data = await this.tagService.findAllPagination(
      query.skip,
      query.take,
      query.name,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  //------------------------------
  @ApiTags('Admin / Tag')
  @ApiOperation({ summary: 'Get One Tag' })
  @ApiCreatedResponse({
    type: GetTagDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Get('admin/tag/:id')
  async findOne(@Param('id') id: string): Promise<GetTagDto> {
    const result = await this.tagService.findOne({
      where: { id },
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Tag')
  @ApiOperation({ summary: 'Update Tag' })
  @ApiCreatedResponse({
    type: GetTagDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @Patch('admin/tag/:id')
  async update(@Param('id') id: string, @Body() data: UpdateTagDto) {
    const result = await this.tagService.update({ id }, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  //----------------------------------
  @ApiTags('Admin / Tag')
  @ApiOperation({ summary: 'Remove Tag by ID' })
  @ApiCreatedResponse({
    type: GetTagDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Delete('admin/tag/:id')
  remove(@Param('id') id: string) {
    return this.tagService.remove(id);
  }

  //------------------------------
  @ApiTags('Tag')
  @ApiOperation({ summary: 'Get All Tags' })
  @ApiCreatedResponse({
    type: GetTagDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('tag')
  async findAllUserScope(@Query() query: PaginationGetTagDto) {
    const data = await this.tagService.findAllPagination(
      query.skip,
      query.take,
      undefined,
      query.isEnabled ? query.isEnabled === 'true' : undefined,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  //------------------------------
  @ApiTags('Tag')
  @ApiOperation({ summary: 'Get One Tag' })
  @ApiCreatedResponse({
    type: GetTagDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('tag/:id')
  async findOneUserScope(@Param('id') id: string): Promise<GetTagDto> {
    const result = await this.tagService.findOne({
      where: { id },
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }
}
