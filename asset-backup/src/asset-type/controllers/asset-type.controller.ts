import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Action } from 'src/common/decorators/action.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorators';
import { Process } from 'src/common/decorators/process.decorator';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { ModifyPatchRequestBodyInterceptors } from 'src/common/interceptors/modify-patch-request-body.interceptor';
import { multerConfig } from 'src/common/multer-configs/multer-config';
import { User } from 'src/users/entities/user.entity';
import { CreateAssetTypeDto } from '../dto/input/create-asset-type.dto';
import { FindAllAssetTypeQueryUserScopeDto } from '../dto/input/find-all-asset-type-query-user-scope.dto';
import { FindAllAssetTypeQueryDto } from '../dto/input/find-all-asset-type-query.dto';
import { GetAssetTypeUserPaginationDto } from '../dto/input/get-asset-type-user-pagination.dto copy';
import { GetAssetTypeVersionUserPaginationDto } from '../dto/input/get-asset-type-version-user-pagination.dto';
import { UpdateAssetTypeDto } from '../dto/input/update-asset-type.dto';
import { AssetTypeService } from '../services/asset-type.service';

@Controller()
export class AssetTypeController {
  constructor(private readonly assetTypeService: AssetTypeService) {}

  //------------------------------
  @ApiOperation({ summary: 'Create Asset Type' })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Type')
  @Post('admin/asset-type')
  async create(@Body() data: CreateAssetTypeDto) {
    const result = await this.assetTypeService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Asset Type Versions' })
  @ApiTags('Admin / Asset-Type')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The id of the asset type to get versions for',
  })
  @UseGuards(AdminGuard)
  @Get('admin/asset-type/archives/:id')
  async getAssetTypeArchives(@Param('id') id: string) {
    const result = await this.assetTypeService.getAssetTypeArchives(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Asset Type With Filter' })
  @ApiTags('Admin / Asset-Type')
  @UseGuards(AdminGuard)
  @Get('admin/asset-type')
  async findAll(@Query() query: FindAllAssetTypeQueryDto) {
    const data = await this.assetTypeService.findAllPaginationAdminScope(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data.items, count: data.total },
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Asset Type' })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Type')
  @Get('admin/asset-type/:id')
  async findOneByIdAdminScope(@Param('id') id: string) {
    const result = await this.assetTypeService.findOneByIdAdminScope(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Asset Type Version' })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Type')
  @Get('admin/asset-type/version/:id')
  async findOneVersionByIdAdminScope(@Param('id') id: string) {
    const result = await this.assetTypeService.findOneVersionById(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Asset Type Version' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiTags('Asset-Type')
  @Get('asset-type/version/:id')
  async findOneVersionByIdUserScope(@Param('id') id: string) {
    const result = await this.assetTypeService.findOneVersionById(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Update Asset Type' })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Type')
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @Patch('admin/asset-type/:id')
  async update(@Param('id') id: string, @Body() data: UpdateAssetTypeDto) {
    const result = await this.assetTypeService.update(id, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Update Asset Type Icon' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        icon: {
          type: 'string',
          format: 'binary',
          nullable: false,
        },
      },
    },
  })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Type')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @UseInterceptors(FileInterceptor('icon', multerConfig))
  @Patch('admin/asset-type/:id/icon')
  async updateAssetTypeIcon(
    @Param('id') id: string,
    @UploadedFile() icon: Express.Multer.File,
  ) {
    const result = await this.assetTypeService.updateAssetTypeIcon(id, icon);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  //----------------------------------
  @ApiOperation({ summary: 'Remove Asset Type by ID' })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Type')
  @Delete('admin/asset-type/:id')
  async remove(@Param('id') id: string) {
    return await this.assetTypeService.remove(id);
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Filter For AssetType' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiTags('Asset-Type')
  @Get('asset-type/:id/filters')
  async findAllForAssetType(@Param('id') id: string) {
    const data = await this.assetTypeService.findAllForAssetType(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Asset Type' })
  @UseGuards(UserGuard)
  @ApiTags('Asset-Type')
  @Get('asset-type/asset-type-for-sampa')
  async findTypeForSampaUser(
    @Query() query: GetAssetTypeUserPaginationDto,
    @CurrentUser() user: User,
  ) {
    const data = await this.assetTypeService.findTypeForSampaUser(
      query.skip,
      query.take,
      query.name,
      query.categoryId,
      user,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Asset Type' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiTags('Asset-Type')
  @Get('asset-type/:id')
  async findOneByIdUserScope(@Param('id') id: string) {
    const result = await this.assetTypeService.findOneByIdUserScope(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Asset Type' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiTags('Asset-Type')
  @Get('asset-type/:id/versions')
  async findOneAssetTypeVersionByIdUserScope(
    @Param('id') assetTypeId: string,
    @Query() query: GetAssetTypeVersionUserPaginationDto,
  ) {
    const data =
      await this.assetTypeService.findOneAssetTypeVersionByIdUserScope(
        query,
        assetTypeId,
      );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Asset Type' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiTags('Asset-Type')
  @Get('asset-type/:id/with-filters')
  async findOneByIdIncludeFiltersUserScope(@Param('id') id: string) {
    const result =
      await this.assetTypeService.findOneByIdIncludeFiltersUserScope(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({
    summary: 'Get All Asset Type User Scope With Dynamic Filter',
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiTags('Asset-Type')
  @Get('asset-type')
  async findAllUserScope(@Query() query: FindAllAssetTypeQueryUserScopeDto) {
    const data = await this.assetTypeService.findAllPaginationUserScope(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data.items, count: data.total },
    });
  }

  //------------------------------
  @ApiOperation({
    summary: 'Get Related Asset Types And Asset Categories With AssetTypeId',
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiTags('Asset-Type')
  @Get('asset-type/related-types/:assetTypeVersionId')
  async findRelatedAssetTypes(
    @Param('assetTypeVersionId', ParseUUIDPipe) assetTypeVersionId: string,
  ) {
    const result =
      await this.assetTypeService.findRelatedAssetTypes(assetTypeVersionId);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({
    summary: 'Search Asset Types by Schema Identifier',
    description:
      'Find all asset types whose schema contains a specific identifier at any depth',
  })
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiTags('Asset-Type')
  @Get('asset-type/search/by-identifier/:identifier')
  async searchByIdentifier(@Param('identifier') identifier: string) {
    const result = await this.assetTypeService.findByIdentifier(identifier);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }
}
