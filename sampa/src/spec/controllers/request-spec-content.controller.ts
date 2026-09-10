import { Body, Controller, Post, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { Member } from 'src/member/entities/member.entity';
import { UpdateSpecContentLayerDto } from '../dto/input/update-spec-content-layer.dto';
import { GetSpecDto } from '../dto/response/get-spec-response.dto';
import { RequestSpecContentService } from '../services/request-spec-content.service';

@ApiTags('Spec-Content')
@Controller('spec-content')
export class RequestSpecContentController {
  constructor(
    private readonly requestSpecContentService: RequestSpecContentService,
  ) {}

  // //------------------------------
  // @ApiOperation({ summary: 'Create Request Spec Content' })
  // @ApiCreatedResponse({
  //   type: GetSpecDto,
  // })
  // @UseGuards(AuthorizationGuard)
  // @UseGuards(UserGuard)
  // @SetMetadata(
  //   AuthorizationMetaDataEnum.Action,
  //   ActionEnum.AwaitingSpecsProvideSpecs,
  // )
  // @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  // @Post('')
  // async create(
  //   @Body() data: CreateSpecContentDto,
  //   @CurrentMember() member: Member,
  //   @CurrentMemberRoles() memberRoles: Role[],
  // ): Promise<GetSpecDto> {
  //   const result = await this.requestSpecContentService.create(
  //     data,
  //     member,
  //     memberRoles,
  //   );
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: result,
  //   });
  // }

  //------------------------------
  @ApiOperation({ summary: 'Create Request Spec Content' })
  @ApiCreatedResponse({
    type: GetSpecDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, ActionEnum.OnboardingAddSpecs)
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Post('assessment-layer')
  async updateSpecForLayer(
    @Body() data: UpdateSpecContentLayerDto,
    @CurrentMember() member: Member,
  ): Promise<GetSpecDto> {
    const result = await this.requestSpecContentService.updateSpecForLayer(
      data,
      member,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  // //------------------------------
  // @ApiOperation({ summary: 'Get All Request Spec Content' })
  // @ApiCreatedResponse({
  //   type: GetSpecDto,
  // })
  // @Get('')
  // async findAll(@Query() query: PaginationDto) {
  //   const data = await this.requestSpecContentService.findAllPagination(
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
  // @ApiOperation({ summary: 'Get One Request Spec Content' })
  // @ApiCreatedResponse({
  //   type: GetSpecDto,
  // })
  // @Get(':id')
  // async findOne(@Param('id') id: string): Promise<GetSpecDto> {
  //   const result = await this.requestSpecContentService.findOne({
  //     where: { id },
  //   });
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: result,
  //   });
  // }

  // //------------------------------
  // @ApiOperation({ summary: 'Update Request Spec Content' })
  // @ApiCreatedResponse({
  //   type: GetSpecDto,
  // })
  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() data: UpdateSpecContentDto) {
  //   const result = await this.requestSpecContentService.update({ id }, data);
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: result,
  //   });
  // }

  // //----------------------------------
  // @ApiOperation({ summary: 'Remove Request Spec Content by ID' })
  // @ApiCreatedResponse({
  //   type: GetSpecDto,
  // })
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.requestSpecContentService.remove({ id });
  // }
}
