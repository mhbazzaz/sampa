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
import { Process } from 'src/common/decorators/process.decorator';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { ModifyPatchRequestBodyInterceptors } from 'src/common/interceptors/modify-patch-request-body.interceptor';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { CreateLocationDto } from '../dto/input/create-location.dto';
import { FindAllLocationQueryDto } from '../dto/input/find-all-location-query.dto';
import { FindAllLocationUserQueryDto } from '../dto/input/find-all-location-user-query.dto';
import { UpdateLocationDto } from '../dto/input/update-location.dto';
import { LocationService } from '../services/location.service';

@Controller('')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  //------------------------------
  @ApiTags('Admin / Location')
  @ApiOperation({ summary: 'Create Location' })
  @UseGuards(AdminGuard)
  @Post('admin/location')
  async create(@Body() data: CreateLocationDto) {
    const result = await this.locationService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Location')
  @ApiOperation({ summary: 'Get All Location With Filter' })
  @UseGuards(AdminGuard)
  @Get('admin/location')
  async findAllAdminScope(@Query() query: FindAllLocationQueryDto) {
    const result = await this.locationService.findAllPagination(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result.items, count: result.total },
    });
  }

  //------------------------------
  @ApiTags('Location')
  @ApiOperation({ summary: 'Get All Related Locations Information' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('location/:id/related-locations')
  async findRelatedLocations(@Param('id') id: string) {
    const result = await this.locationService.findRelatedLocations(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Location')
  @ApiOperation({ summary: 'Get Asset Versions By Location Id' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('location/:locationId/asset-versions')
  async findAssetVersionsByLocationId(
    @Param('locationId') locationId: string,
    @Query() query: PaginationDto,
  ) {
    const result = await this.locationService.findAssetVersionsByLocationId(
      locationId,
      query,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result.data, count: result.total },
    });
  }

  //------------------------------
  @ApiTags('Location')
  @ApiOperation({ summary: 'Get All Base Locations Information' })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Action(ActionEnum.Read)
  @Process(ProcessEnum.AssetManagement)
  @Get('location/base-locations')
  async findBaseLocations() {
    const result = await this.locationService.findBaseLocations();
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Location')
  @ApiOperation({ summary: 'Get One Location' })
  @UseGuards(AdminGuard)
  @Get('admin/location/:id')
  async findOneLocation(@Param('id') id: string) {
    const result = await this.locationService.findOneLocationAdmin(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Location')
  @ApiOperation({ summary: 'Update Location' })
  @UseGuards(AdminGuard)
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @Patch('admin/location/:id')
  async update(@Param('id') id: string, @Body() data: UpdateLocationDto) {
    return await this.locationService.update({ id }, data);
  }

  //----------------------------------
  @ApiTags('Admin / Location')
  @ApiOperation({ summary: 'Remove Location by ID' })
  @UseGuards(AdminGuard)
  @Delete('admin/location/:id')
  async remove(@Param('id') id: string) {
    return await this.locationService.remove(id);
  }

  //------------------------------
  @ApiTags('Location')
  @ApiOperation({ summary: 'Get All LocationType With Filter' })
  @UseGuards(UserGuard)
  @Get('location')
  async findAllUserScope(@Query() query: FindAllLocationUserQueryDto) {
    const result = await this.locationService.findAllUserScope(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result.items, count: result.total },
    });
  }

  //------------------------------
  @ApiTags('Location')
  @ApiOperation({ summary: 'Get One Location' })
  @UseGuards(UserGuard)
  @Get('location/:id')
  async findOneLocationUser(@Param('id') id: string) {
    const result = await this.locationService.findOneLocation(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }
}
