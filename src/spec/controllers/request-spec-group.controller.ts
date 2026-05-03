import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestSpecGroupService } from '../services/request-spec-group.service';

@ApiTags('Spec-Group')
@Controller('spec-group')
export class RequestSpecGroupController {
  constructor(
    private readonly requestSpecGroupService: RequestSpecGroupService,
  ) {}

  // //------------------------------
  // @ApiOperation({ summary: 'Create Request Spec Group' })
  // @ApiCreatedResponse({
  //   type: GetSpecDto,
  // })
  // @Post('')
  // async create(@Body() data: CreateSpecGroupDto): Promise<GetSpecDto> {
  //   const result = await this.requestSpecGroupService.create(data);
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: result,
  //   });
  // }

  // //------------------------------
  // @ApiOperation({ summary: 'Get All Request Spec Group' })
  // @ApiCreatedResponse({
  //   type: GetSpecDto,
  // })
  // @Get('')
  // async findAll(@Query() query: PaginationDto) {
  //   const data = await this.requestSpecGroupService.findAllPagination(
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
  // @ApiOperation({ summary: 'Get One Request Spec Group' })
  // @ApiCreatedResponse({
  //   type: GetSpecDto,
  // })
  // @Get(':id')
  // async findOne(@Param('id') id: string): Promise<GetSpecDto> {
  //   const result = await this.requestSpecGroupService.findOne({
  //     where: { id },
  //   });
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: result,
  //   });
  // }

  // //------------------------------
  // @ApiOperation({ summary: 'Update Request Spec Group' })
  // @ApiCreatedResponse({
  //   type: GetSpecDto,
  // })
  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() data: UpdateSpecGroupDto) {
  //   const result = await this.requestSpecGroupService.update({ id }, data);
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: result,
  //   });
  // }

  // //----------------------------------
  // @ApiOperation({ summary: 'Remove Request Spec Group by ID' })
  // @ApiCreatedResponse({
  //   type: GetSpecDto,
  // })
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.requestSpecGroupService.remove({ id });
  // }
}
