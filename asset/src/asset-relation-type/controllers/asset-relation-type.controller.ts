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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { ModifyPatchRequestBodyInterceptors } from 'src/common/interceptors/modify-patch-request-body.interceptor';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { CreateAssetRelationTypeDto } from '../dto/input/create-asset-relation-type.dto';
import { UpdateAssetRelationTypeDto } from '../dto/input/update-asset-relation-type.dto';
import { AssetRelationTypeService } from '../services/asset-relation-type.service';

@ApiTags('Admin / Asset-Relation-Type')
@UseGuards(AdminGuard)
@Controller('admin/asset-relation-type')
export class AssetRelationTypeController {
  constructor(
    private readonly assetRelationTypeService: AssetRelationTypeService,
  ) {}

  //------------------------------
  @ApiOperation({ summary: 'Create Asset Relation Type' })
  @Post('')
  async create(@Body() data: CreateAssetRelationTypeDto) {
    const result = await this.assetRelationTypeService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Asset Relation Type' })
  @Get('')
  async findAll(@Query() query: PaginationDto) {
    const data = await this.assetRelationTypeService.findAllPagination(
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
  @ApiOperation({ summary: 'Get One Asset Relation Type' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.assetRelationTypeService.findOne({
      where: { id },
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Update Asset Relation Type' })
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateAssetRelationTypeDto,
  ) {
    const result = await this.assetRelationTypeService.update({ id }, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  //----------------------------------
  @ApiOperation({ summary: 'Remove Asset Relation Type by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.assetRelationTypeService.remove(id);
  }
}
