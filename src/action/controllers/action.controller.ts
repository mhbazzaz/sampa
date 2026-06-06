import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActionService } from '../services/action.service';

@ApiTags('Action')
@Controller('action')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  //------------------------------
  // @ApiOperation({ summary: 'Create Action' })
  // @ApiCreatedResponse({
  //   type: GetActionDto,
  // })
  // @UseGuards(UserGuard)
  // @Post('')
  // async create(@Body() data: CreateActionDto): Promise<GetActionDto> {
  //   const result = await this.actionService.create(data);
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: result,
  //   });
  // }

  // //------------------------------
  // @ApiOperation({ summary: 'Get All Action' })
  // @ApiCreatedResponse({
  //   type: GetActionDto,
  // })
  // @UseGuards(UserGuard)
  // @Get('')
  // async findAll(@Query() query: PaginationDto) {
  //   const data = await this.actionService.findAllPagination(
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
  // @ApiOperation({ summary: 'Get One Action' })
  // @ApiCreatedResponse({
  //   type: GetActionDto,
  // })
  // @UseGuards(UserGuard)
  // @Get(':id')
  // async findOne(@Param('id') id: string): Promise<GetActionDto> {
  //   const result = await this.actionService.findOne({ where: { id } });
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: result,
  //   });
  // }

  // //------------------------------
  // @ApiOperation({ summary: 'Update Action' })
  // @ApiCreatedResponse({
  //   type: GetActionDto,
  // })
  // @UseGuards(UserGuard)
  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() data: UpdateActionDto) {
  //   const result = await this.actionService.update({ id }, data);
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: [result],
  //   });
  // }

  // //----------------------------------
  // @ApiOperation({ summary: 'Remove Action by ID' })
  // @ApiCreatedResponse({
  //   type: GetActionDto,
  // })
  // @UseGuards(UserGuard)
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.actionService.remove({ id });
  // }
}
