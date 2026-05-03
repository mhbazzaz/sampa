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
import { AdminGuard } from 'src/common/guards/admin.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { CreateSpecItemDto } from '../dto/input/create-spec-item.dto';
import { FindFilteredRequestSpecItemQueryDto } from '../dto/input/find-filtered-request-spec-item.dto';
import { GetSpecItemDto } from '../dto/input/get-spec-item.dto';
import { UpdateSpecItemDto } from '../dto/input/update-spec-item.dto';
import { GetSpecDto } from '../dto/response/get-spec-response.dto';
import { RequestSpecItemService } from '../services/request-spec-item.service';

@Controller()
export class RequestSpecItemController {
  constructor(
    private readonly requestSpecItemService: RequestSpecItemService,
  ) {}

  //------------------------------
  @ApiTags('Admin / Spec-Item')
  @ApiOperation({ summary: 'Create Request Spec Item' })
  @ApiCreatedResponse({
    type: GetSpecDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Post('admin/spec-item')
  async create(@Body() data: CreateSpecItemDto): Promise<GetSpecDto> {
    const result = await this.requestSpecItemService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Spec-Item')
  @ApiOperation({ summary: 'Get All Request Spec Item' })
  @ApiCreatedResponse({
    type: GetSpecDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('spec-item')
  async findAll(@Query() query: GetSpecItemDto) {
    const data =
      await this.requestSpecItemService.findAllPaginationUserScope(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  //------------------------------
  @ApiTags('Admin / Spec-Item')
  @ApiOperation({ summary: 'Get All Request Spec Item' })
  @ApiCreatedResponse({
    type: GetSpecDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Get('admin/spec-item')
  async findAllAdminScope(@Query() query: PaginationDto) {
    const data = await this.requestSpecItemService.findAllPagination(
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
  @ApiTags('Admin / Spec-Item')
  @ApiOperation({
    summary:
      'Get Request Spec Items With Filter On AssetTypeId and EnvironmentId and RequestSpecId and assessmentLayerId',
  })
  @ApiCreatedResponse({
    type: GetSpecDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Get('admin/spec-item/filtered')
  async getFilteredRequestSpecItems(
    @Query() query: FindFilteredRequestSpecItemQueryDto,
  ) {
    const result =
      await this.requestSpecItemService.getFilteredRequestSpecItems(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Admin / Spec-Item')
  @ApiOperation({ summary: 'Get One Request Spec Item By ID' })
  @ApiCreatedResponse({
    type: GetSpecDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Get('admin/spec-item/:id')
  async findOneAdminScope(@Param('id') id: string) {
    const data = await this.requestSpecItemService.findOne({
      where: { id },
      relations: {
        assessmentType: { assessmentLayers: true },
        assetType: true,
        environment: true,
      },
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data,
    });
  }

  //------------------------------
  @ApiTags('Admin / Spec-Item')
  @ApiOperation({ summary: 'Update Request Spec Item' })
  @ApiCreatedResponse({
    type: GetSpecDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Patch('admin/spec-item/:id')
  async update(@Param('id') id: string, @Body() data: UpdateSpecItemDto) {
    const result = await this.requestSpecItemService.update({ id }, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //----------------------------------
  @ApiTags('Admin / Spec-Item')
  @ApiOperation({
    summary: 'Remove Request Spec Item And Relations By Request-Spec-Item ID',
  })
  @ApiCreatedResponse({
    type: GetSpecDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Delete('admin/spec-item/:id')
  remove(@Param('id') id: string) {
    return this.requestSpecItemService.removeRequestSpecItem(id);
  }

  //----------------------------------
  @ApiTags('Admin / Spec-Item')
  @ApiOperation({
    summary:
      'Remove Specific Request Spec Item Relations By Request-Spec-Item ID',
  })
  @ApiCreatedResponse({
    type: GetSpecDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Delete('admin/spec-item/:id/relations')
  removeRelations(@Param('id') id: string) {
    return this.requestSpecItemService.removeRelations(id);
  }
}
