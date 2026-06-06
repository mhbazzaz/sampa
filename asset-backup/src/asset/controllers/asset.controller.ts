import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Action } from 'src/common/decorators/action.decorator';
import { CurrentUserRoles } from 'src/common/decorators/current-user-roles.decorators';
import { CurrentUser } from 'src/common/decorators/current-user.decorators';
import { NoWhitelistBody } from 'src/common/decorators/no-whitelist-body.decorator';
import { Process } from 'src/common/decorators/process.decorator';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AssetModificationAccessGuard } from 'src/common/guards/asset-modification-access.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { InternalCommunicationGuard } from 'src/common/guards/internal-communication.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { ModifyPatchRequestBodyInterceptors } from 'src/common/interceptors/modify-patch-request-body.interceptor';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { Role } from 'src/role/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { assetBodyReportJsonDto } from '../dto/input/asset-body-report-json.dto';
import { assetSearchBodyReportExportExcelDto } from '../dto/input/asset-search-body-report-export-excel.dto';
import { assetSearchBodyReportDto } from '../dto/input/asset-search-body-report.dto';
import { CreateAssetDto } from '../dto/input/create-asset.dto';
import { FindAllAssetQueryDto } from '../dto/input/find-all-asset-query.dto';
import { findAllAssetReportQueryDto } from '../dto/input/find-all-asset-report.query.dto';
import { FindAllAssetQueryWithOutPaginateDto } from '../dto/input/find-all-asset-without-paginate.dto';
import { GetLogSourceGroupsDTO } from '../dto/input/get-log-source-groups.dto';
import { GetLogSourceTypeDTO } from '../dto/input/get-log-source-type.dto';
import { UpdateAssetDto } from '../dto/input/update-asset.dto';
import { GetAssetDto } from '../dto/response/get-asset.dto';
import { AssetScoreService } from '../services/asset-score.service';
import { AssetService, searchBodyTag } from '../services/asset.service';

@Controller('')
export class AssetController {
  constructor(
    private readonly assetService: AssetService,
    private readonly assetScoreService: AssetScoreService,
  ) {}

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Create Asset' })
  @UseGuards(UserGuard, AuthorizationGuard)
  @Action(ActionEnum.Save)
  @Process(ProcessEnum.AssetManagement)
  @Post('asset')
  async create(
    @CurrentUser() user: User,
    @CurrentUserRoles() userRoles: Role[],
    @Body() data: CreateAssetDto,
    @Req() req: Request,
  ): Promise<GetAssetDto> {
    const result = await this.assetService.create(user, userRoles, data, req);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Asset With Filter' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset')
  @Get('admin/asset')
  async findAllAdminScope(@Query() query: FindAllAssetQueryDto) {
    const result = await this.assetService.findAllPagination(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result.data, count: result.count },
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Asset With Filter' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset')
  @Post('admin/asset/index-for-elasticsearch')
  async indexAllAssetsToElasticsearch() {
    await this.assetService.indexAllAssetsToElasticsearch();
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Asset With Filter For Retrieval' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(AdminGuard)
  @ApiTags('Admin / Asset')
  @Get('admin/asset/filtered')
  async findAllFilteredAdminScope(
    @Query() query: FindAllAssetQueryWithOutPaginateDto,
  ) {
    const result = await this.assetService.findAllWithOutPaginate(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result.data, count: result.count },
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get All Asset With Filter' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @Get('asset')
  async findAllUserScope(@Query() query: FindAllAssetQueryDto) {
    const result = await this.assetService.findAllPagination(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result.data, count: result.count },
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get Asset Info By Asset Name' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(UserGuard)
  @Get('asset/log-source-groups')
  async getLogSourceGroups(
    @Query() query: GetLogSourceGroupsDTO,
    @CurrentUser() user: User,
  ): Promise<GetAssetDto> {
    const result = await this.assetService.getLogSourceGroups(query, user);
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
  @UseGuards(UserGuard)
  @Get('asset/log-source/types')
  async getLogSourceTypes(
    @Query() query: GetLogSourceTypeDTO,
    @CurrentUser() user: User,
  ): Promise<GetAssetDto> {
    const result = await this.assetService.getLogSourceTypes(query, user);
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
  @UseGuards(UserGuard)
  @Get('asset/log-source/:typeId/protocol')
  async getLogSourceProtocols(
    @Query() query: GetLogSourceTypeDTO,
    @Param('typeId') typeId: string,
    @CurrentUser() user: User,
  ): Promise<GetAssetDto> {
    const result = await this.assetService.getLogSourceProtocols(
      query,
      typeId,
      user,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get All Asset With Filter' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @HttpCode(200)
  @Post('asset/search')
  async searchUserScope(
    @CurrentUser() user: User,
    @CurrentUserRoles() userRoles: Role[],
    @Query()
    query: PaginationDto,
    @Body()
    body: searchBodyTag,
  ) {
    const result = await this.assetService.searchUserScope(
      user,
      userRoles,
      query,
      body,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get All Asset With Filter for report' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.GetReport)
  @Process(ProcessEnum.AssetManagement)
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @HttpCode(200)
  @Post('asset/report')
  async reportUserScope(
    @CurrentUser() user: User,
    @CurrentUserRoles() userRoles: Role[],
    @Query()
    query: findAllAssetReportQueryDto,
    @NoWhitelistBody(assetSearchBodyReportDto)
    body: assetSearchBodyReportDto,
  ) {
    const result = await this.assetService.reportUserScope(
      user,
      userRoles,
      query,
      body,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get All Asset With Filter' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.GetReport)
  @Process(ProcessEnum.AssetManagement)
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @HttpCode(200)
  @Post('asset/report/csv')
  async streamCsv(
    @CurrentUser() user: User,
    @CurrentUserRoles() userRoles: Role[],
    @NoWhitelistBody(assetSearchBodyReportDto)
    body: assetSearchBodyReportDto,
    @Res()
    res: Response,
  ) {
    return this.assetService.reportUserScopeFile(
      user,
      userRoles,
      body,
      res,
      'csv',
    );
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get All Asset With Filter' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.GetReport)
  @Process(ProcessEnum.AssetManagement)
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @HttpCode(200)
  @Post('asset/report/excel')
  async streamExcel(
    @CurrentUser() user: User,
    @CurrentUserRoles() userRoles: Role[],
    @NoWhitelistBody(assetSearchBodyReportExportExcelDto)
    body: assetSearchBodyReportExportExcelDto,
    @Res()
    res: Response,
  ) {
    return this.assetService.reportUserScopeFile(
      user,
      userRoles,
      body,
      res,
      'xls',
    );
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get All Asset For Power BI' })
  @ApiHeader({ name: 'x-internal-communication-token' })
  @UseGuards(InternalCommunicationGuard)
  @HttpCode(200)
  @Post('asset/report/json')
  async getReportJson(
    @NoWhitelistBody(assetBodyReportJsonDto)
    body: assetBodyReportJsonDto,
    @Query()
    query: PaginationDto,
  ) {
    return this.assetService.getReportJson(body, query);
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Asset fields auto complete' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @Post('asset/search/auto-complete')
  async autoComplete(
    @Body() body: Record<string, Record<string, object | string> | string>,
  ) {
    const result = await this.assetService.autoComplete(body);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get All Asset With Filter' })
  @UseGuards(UserGuard, AuthorizationGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @Get('asset/archives/:referenceId')
  async getAssetArchives(
    @Param('referenceId') referenceId: string,
    @Query() query: PaginationDto,
  ) {
    const result = await this.assetService.getAssetArchives(referenceId, query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get All Asset With Filter For Sampa' })
  @ApiHeader({ name: 'x-internal-communication-token' })
  @UseGuards(InternalCommunicationGuard)
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @Get('asset/archives-for-sampa/:referenceId')
  async getAssetArchivesForSampa(
    @Param('referenceId') referenceId: string,
    @Query() query: PaginationDto,
  ) {
    const result = await this.assetService.getAssetArchives(referenceId, query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get One Asset With Related Ones' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(UserGuard, AuthorizationGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('asset/:id/relations')
  async getAssetRelations(@Param('id') id: string): Promise<GetAssetDto> {
    const result = await this.assetService.getAssetRelations(id);
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
  @UseGuards(UserGuard)
  @Get('assets/current-user-assets')
  async currentUserAssets(
    @CurrentUser() user: User,
    @Query('assetTypeId') assetTypeId: string,
  ) {
    const result = await this.assetService.currentUserAssets(user, assetTypeId);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get One Asset Version Information' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(UserGuard, AuthorizationGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('asset/version/:id')
  async findOneAsset(@Param('id') id: string): Promise<GetAssetDto> {
    const result = await this.assetService.findOneAsset({
      where: { id },
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get Related Assets With AssetId' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(UserGuard, AuthorizationGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('asset/version/:id/related-asset')
  async getRelatedAssets(@Param('id') id: string): Promise<GetAssetDto> {
    const result = await this.assetService.getRelatedAssets(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get One Asset With ReferenceID and BaseLine' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('asset/filtered/:referenceId/:baseline')
  async findOneWithFilter(
    @Param('referenceId') referenceId: string,
    @Param('baseline') baseline: string,
  ): Promise<GetAssetDto> {
    const result = await this.assetService.findOneWithFilter(
      referenceId,
      baseline,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Update Asset' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(UserGuard, AuthorizationGuard, AssetModificationAccessGuard)
  @Action(ActionEnum.Save)
  @Process(ProcessEnum.AssetManagement)
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @Patch('asset/:id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateAssetDto,
    @CurrentUser() user: User,
    @CurrentUserRoles() userRoles: Role[],
    @Req() req: Request,
  ) {
    return await this.assetService.update({ id }, data, user, userRoles, req);
  }

  //----------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Remove Asset by ID' })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Delete)
  @Process(ProcessEnum.AssetManagement)
  @Delete('asset/:id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @CurrentUserRoles() userRoles: Role[],
    @Req() req: Request,
  ) {
    return await this.assetService.remove({ id }, user, userRoles, req);
  }

  //----------------------------------
  @ApiTags('Asset')
  @ApiOperation({ summary: 'Get Asset Scores' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('asset/scores')
  async getAssetScores() {
    return this.assetScoreService.getAssetScores();
  }

  //------------------------------
  @ApiTags('Asset / Dashboard')
  @ApiOperation({
    summary:
      'Get Last Created And Modified Assets By Subordinates (During Last Week)',
  })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('asset/last-week-assets')
  async getLastWeekAssetVersions(
    @CurrentUser() user: User,
    @CurrentUserRoles() userRoles: Role[],
  ) {
    const result = await this.assetService.getLastWeekAssetVersions(
      user,
      userRoles,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset / Dashboard')
  @ApiOperation({
    summary: 'Get accessible assets for user from all assets',
  })
  @ApiCreatedResponse({
    type: GetAssetDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('asset/accessible-for-user')
  async getAccessibleAssets(
    @CurrentUser() user: User,
    @CurrentUserRoles() userRoles: Role[],
  ) {
    const result = await this.assetService.getAccessibleAssets(user, userRoles);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset / Dashboard')
  @ApiOperation({
    summary: 'Get accessible assets filtered by asset types',
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('assets/accessible')
  async getAccessibleAssetsByTypes(
    @CurrentUser() user: User,
    @CurrentUserRoles() userRoles: Role[],
  ) {
    const result = await this.assetService.getAccessibleAssetsByTypes(
      user,
      userRoles,
    );

    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Asset / Dashboard')
  @ApiOperation({
    summary: 'Get count of accessible asset versions grouped by responsibility',
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('assets/accessible/responsibility-count')
  async getAccessibleAssetVersionResponsibilityCounts(
    @CurrentUser() user: User,
    @CurrentUserRoles() userRoles: Role[],
  ) {
    const result =
      await this.assetService.getAccessibleAssetVersionResponsibilityCounts(
        user,
        userRoles,
      );

    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }
}
