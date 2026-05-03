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
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { InternalCommunicationGuard } from 'src/common/guards/internal-communication.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { Member } from 'src/member/entities/member.entity';
import { CreateAssetTypeDto } from '../dto/input/create-asset-type.dto';
import { UpdateAssetTypeDto } from '../dto/input/update-asset-type.dto';
import { GetAssetDto } from '../dto/response/get-asset.dto';
import { AssetType } from '../entities/asset-type.entity';
import { AssetTypeService } from '../services/asset-type.service';

@Controller()
export class AssetTypeController {
  constructor(private readonly assetTypeService: AssetTypeService) {}

  //------------------------------
  @ApiTags('Admin / Asset-Type')
  @ApiOperation({ summary: 'Create Asset Type' })
  @ApiCreatedResponse({
    type: AssetType,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Post('admin/asset-type')
  async create(@Body() data: CreateAssetTypeDto): Promise<GetAssetDto> {
    const result = await this.assetTypeService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Asset-Type')
  @ApiOperation({ summary: 'Get All Asset Type' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Get('admin/asset-type')
  async findAllAdminScope(@Query() query: PaginationDto) {
    const data = await this.assetTypeService.findAllPagination(
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
  @ApiTags('Admin / Asset-Type')
  @ApiOperation({ summary: 'Get All Asset Type' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(InternalCommunicationGuard)
  @Get('asset-type/internal')
  async findAllScopeInternal() {
    const data = await this.assetTypeService.findAllScopeInternal();
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: data,
    });
  }

  //------------------------------
  @ApiTags('Admin / Asset-Type')
  @ApiOperation({ summary: 'Get One AssetType' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Get('admin/asset-type/:id')
  async findOneAdminScope(@Param('id') id: string): Promise<GetAssetDto> {
    const result = await this.assetTypeService.findOne({ where: { id } });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset-Type')
  @ApiOperation({ summary: 'Get One AssetType' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('asset-type/:id')
  async findOneUserScope(
    @Param('id') id: string,
    @CurrentMember() member: Member,
  ): Promise<GetAssetDto> {
    const result = await this.assetTypeService.findOneUserScope(id, member);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Asset-Type')
  @ApiOperation({ summary: 'Update AssetType' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Patch('admin/asset-type/:id')
  async update(@Param('id') id: string, @Body() data: UpdateAssetTypeDto) {
    const result = await this.assetTypeService.update({ id }, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  //----------------------------------
  @ApiTags('Admin / Asset-Type')
  @ApiOperation({ summary: 'Remove AssetType by ID' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Delete('admin/asset-type/:id')
  remove(@Param('id') id: string) {
    return this.assetTypeService.remove({ id });
  }
}
