import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProcessService } from '../services/process.service';

@ApiTags('Process')
@Controller('process')
export class ProcessController {
  constructor(private readonly permissionGroupService: ProcessService) {}

  // //------------------------------
  // @ApiOperation({ summary: 'Create Permission Group' })
  // @ApiCreatedResponse({
  //   type: GetProcessDto,
  // })
  // @ApiBearerAuth('idp-token')
  // @UseGuards(UserGuard)
  // @Post('')
  // async create(@Body() data: CreateProcessDto): Promise<GetProcessDto> {
  //   const result = await this.permissionGroupService.create(data);
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: result,
  //   });
  // }

  // //------------------------------
  // @ApiOperation({ summary: 'Get All Permission Group' })
  // @ApiCreatedResponse({
  //   type: GetProcessDto,
  // })
  // @ApiBearerAuth('idp-token')
  // @UseGuards(UserGuard)
  // @Get('')
  // async findAll(@Query() query: PaginationDto) {
  //   const data = await this.permissionGroupService.findAllPagination(
  //     query.skip,
  //     query.take,
  //   );
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: { data: data[0], count: data[1] },
  //   });
  // }

  // //------------------------------
  // @ApiOperation({ summary: 'Get One Permission Group' })
  // @ApiCreatedResponse({
  //   type: GetProcessDto,
  // })
  // @ApiBearerAuth('idp-token')
  // @UseGuards(UserGuard)
  // @Get(':id')
  // async findOne(@Param('id') id: string): Promise<GetProcessDto> {
  //   const result = await this.permissionGroupService.findOne({
  //     where: { id },
  //   });
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: result,
  //   });
  // }

  // //------------------------------
  // @ApiOperation({ summary: 'Update Permission Group' })
  // @ApiCreatedResponse({
  //   type: GetProcessDto,
  // })
  // @ApiBearerAuth('idp-token')
  // @UseGuards(UserGuard)
  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() data: UpdateProcessDto) {
  //   const result = await this.permissionGroupService.update({ id }, data);
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: [result],
  //   });
  // }

  // //----------------------------------
  // @ApiOperation({ summary: 'Remove Permission Group by ID' })
  // @ApiCreatedResponse({
  //   type: GetProcessDto,
  // })
  // @ApiBearerAuth('idp-token')
  // @UseGuards(UserGuard)
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.permissionGroupService.remove({ id });
  // }
}
