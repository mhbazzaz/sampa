import {
  Body,
  Controller,
  Get,
  Param,
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
import { Request } from 'express';
import { ContextRequest } from 'src/common/decorators/context-request.decorator';
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { Member } from 'src/member/entities/member.entity';
import { AssetRetrievalArrayDto } from '../dto/input/asset-retrieval.dto';
import { FindAllAssetQueryDto } from '../dto/input/get-asset-filtered-query-params.dto';
import { GetAssetsGroupedVersionsDTO } from '../dto/input/get-assets-grouped-versions.dto';
import { GetAssetsGroupedDTO } from '../dto/input/get-assets-grouped.dto';
import { GetAssetDto } from '../dto/response/get-asset.dto';
import { AssetService } from '../services/asset-to-audit.service';

@Controller('')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({
    summary: 'Get All Asset With Filter In Query Params',
  })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('asset')
  async findAllUserScope(@Query() query: FindAllAssetQueryDto) {
    const result = await this.assetService.findAllPagination(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get Asset Info By Asset Name' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('asset/get-asset-info/:name')
  async getAssetInfo(@Param('name') name: string): Promise<GetAssetDto> {
    const result = await this.assetService.getAssetInfo(name);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get Asset Info By Asset Name' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('asset/grouped')
  async getAssetsGrouped(
    @Query() query: GetAssetsGroupedDTO,
    @CurrentMember() member: Member,
  ): Promise<GetAssetDto> {
    const result = await this.assetService.getAssetsGrouped(query, member);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get Asset Info By Asset Name' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('asset/grouped/versions')
  async getAssetsGroupedVersions(
    @Query() query: GetAssetsGroupedVersionsDTO,
    @CurrentMember() member: Member,
  ): Promise<GetAssetDto> {
    const result = await this.assetService.getAssetsGroupedVersions(
      query,
      member,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Asset')
  @ApiOperation({
    summary: 'Asset Retrieval From Asset-Management For Sampa App',
  })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Post('admin/asset/retrieval')
  async assetRetrieval(
    @Body() data: AssetRetrievalArrayDto,
    @ContextRequest() req: Request,
  ): Promise<GetAssetDto> {
    const authToken = req.headers.authorization;

    const result = await this.assetService.assetRetrieval(data, authToken);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }
}
