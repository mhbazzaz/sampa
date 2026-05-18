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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { ModifyPatchRequestBodyInterceptors } from 'src/common/interceptors/modify-patch-request-body.interceptor';
import { CreateLocationTypeDto } from '../dto/input/create-location-type.dto';
import { FindAllLocationTypeQueryDto } from '../dto/input/find-all-location-type-query.dto';
import { FindAllLocationTypeUserQueryDto } from '../dto/input/find-all-location-type-user-query.dto';
import { UpdateLocationTypeDto } from '../dto/input/update-location-type.dto';
import { LocationTypeService } from '../services/location-type.service';

@Controller('')
export class LocationTypeController {
  constructor(private readonly locationService: LocationTypeService) {}

  //------------------------------
  @ApiTags('Admin / LocationType')
  @ApiOperation({ summary: 'Create LocationType' })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Post('admin/location-type')
  async create(@Body() data: CreateLocationTypeDto) {
    const result = await this.locationService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / LocationType')
  @ApiOperation({ summary: 'Get All LocationType With Filter' })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Get('admin/location-type')
  async findAllAdminScope(@Query() query: FindAllLocationTypeQueryDto) {
    const result = await this.locationService.findAllPagination(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Admin / LocationType')
  @ApiOperation({ summary: 'Get One LocationType' })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Get('admin/location-type/:id')
  async findOneLocationType(@Param('id') id: string) {
    const result = await this.locationService.findOne({
      where: { id },
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / LocationType')
  @ApiOperation({ summary: 'Update LocationType' })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @Patch('admin/location-type/:id')
  async update(@Param('id') id: string, @Body() data: UpdateLocationTypeDto) {
    return await this.locationService.update({ id }, data);
  }

  //----------------------------------
  @ApiTags('Admin / LocationType')
  @ApiOperation({ summary: 'Remove LocationType by ID' })
  @ApiBearerAuth('adminAccessToken')
  @UseGuards(AdminGuard)
  @Delete('admin/location-type/:id')
  async remove(@Param('id') id: string) {
    return await this.locationService.remove(id);
  }

  //------------------------------
  @ApiTags('LocationType')
  @ApiOperation({ summary: 'Get All LocationType With Filter' })
  @ApiBearerAuth('accessToken')
  @UseGuards(UserGuard)
  @Get('location-type')
  async findAllUserScope(@Query() query: FindAllLocationTypeUserQueryDto) {
    const result = await this.locationService.findAllUserScope(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }
}
