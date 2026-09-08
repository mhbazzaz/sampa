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
import { User } from 'src/users/entities/user.entity';
import { CreateAssetCategoryDto } from '../dto/input/create-asset-category.dto';
import { FindAllAdminScopeDto } from '../dto/input/find-all-admin-scope-quey.dto';
import { GetAssetCategoryUserPaginationDto } from '../dto/input/get-asset-category-user-pagination.dto';
import { UpdateAssetCategoryDto } from '../dto/input/update-asset-category.dto';
import { AssetCategoryService } from '../services/asset-category.service';

@ApiTags()
@Controller()
export class AssetCategoryController {
  constructor(private readonly assetCategoryService: AssetCategoryService) {}

  //------------------------------
  @ApiOperation({ summary: 'Create Asset Category' })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Category')
  @Post('admin/asset-category')
  async create(@Body() data: CreateAssetCategoryDto) {
    const result = await this.assetCategoryService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Asset Category' })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Category')
  @Get('admin/asset-category')
  async findAllAdminScope(@Query() query: FindAllAdminScopeDto) {
    const data = await this.assetCategoryService.findAllPagination(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Asset Category' })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Category')
  @Get('admin/asset-category/:id')
  async findOne(@Param('id') id: string) {
    const result = await this.assetCategoryService.findOne({ where: { id } });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Update Asset Category' })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Category')
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @Patch('admin/asset-category/:id')
  async update(@Param('id') id: string, @Body() data: UpdateAssetCategoryDto) {
    const result = await this.assetCategoryService.update({ id }, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  //----------------------------------
  @ApiOperation({ summary: 'Remove Asset Category by ID' })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset-Category')
  @Delete('admin/asset-category/:id')
  async remove(@Param('id') id: string) {
    return await this.assetCategoryService.remove(id);
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Asset Category' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiTags('Asset-Category')
  @Get('asset-category')
  async findAllUserScope(@Query() query: GetAssetCategoryUserPaginationDto) {
    const data = await this.assetCategoryService.findAllPaginationUserScope(
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
  @ApiOperation({ summary: 'Get All Asset Category' })
  @UseGuards(UserGuard)
  @ApiTags('Asset-Category')
  @Get('asset-category/asset-category-for-sampa')
  async findCategoryForSampaUser(
    @Query() query: GetAssetCategoryUserPaginationDto,
    @CurrentUser() user: User,
  ) {
    const data = await this.assetCategoryService.findCategoryForSampaUser(
      query,
      user,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }
}
