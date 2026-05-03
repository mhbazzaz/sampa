import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { InternalCommunicationGuard } from 'src/common/guards/internal-communication.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { Member } from 'src/member/entities/member.entity';
import { GetAssetDto } from '../dto/response/get-asset.dto';
import { AssetCategoryService } from '../services/asset-category.service';

@ApiTags('Asset-Category')
@Controller('asset-category')
export class AssetCategoryController {
  constructor(private readonly assetCategoryService: AssetCategoryService) {}

  //------------------------------
  @ApiOperation({ summary: 'Get All Asset Categories With Filter' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('')
  async findAll(@Query() query: PaginationDto) {
    const result = await this.assetCategoryService.findAllPagination(
      query.skip,
      query.take,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Asset-Type')
  @ApiOperation({ summary: 'Get All Asset Type' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(InternalCommunicationGuard)
  @Get('internal')
  async findAllScopeInternal() {
    const data = await this.assetCategoryService.findAllScopeInternal();
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: data,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Asset Categories With Filter' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('my-categories')
  async findAllMyCategories(
    @Query() query: PaginationDto,
    @CurrentMember() currentMember: Member,
  ) {
    const result = await this.assetCategoryService.findAllMyCategories(
      query.skip,
      query.take,
      currentMember,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Asset By ID Categories With Filter' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.assetCategoryService.findOne({
      where: { id },
      relations: { assetTypes: true },
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Asset By ID Categories With Filter' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get(':id/my-asset-types')
  async findOneMyAssetTypes(
    @Param('id') id: string,
    @CurrentMember() member: Member,
  ) {
    const result = await this.assetCategoryService.findOneMyAssetTypes(
      id,
      member,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }
}
