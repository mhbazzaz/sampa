import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { Member } from 'src/member/entities/member.entity';
import { CreateGroupDto } from '../dto/input/create-group.dto';
import { GetGroupDto } from '../dto/response/get-group.dto';
import { GroupService } from '../services/group.service';

@ApiTags('Group')
@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  //------------------------------
  @ApiOperation({
    summary: `Create Group, ${ActionEnum.ApplicantManagerTeamup} | ${ProcessEnum.AssessmentRequest}`,
  })
  @ApiCreatedResponse({
    type: GetGroupDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(
    AuthorizationMetaDataEnum.Action,
    ActionEnum.ApplicantManagerTeamup,
  )
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Post('')
  async create(
    @Body() data: CreateGroupDto,
    @CurrentMember() member: Member,
  ): Promise<GetGroupDto> {
    const result = await this.groupService.createGroup(data, member);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Create Group, ${ActionEnum.ApplicantManagerTeamup} | ${ProcessEnum.AssessmentRequest}`,
  })
  @ApiCreatedResponse({
    type: GetGroupDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(
    AuthorizationMetaDataEnum.Action,
    ActionEnum.ApplicantManagerTeamup,
  )
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get('')
  async findAll(
    @Query() query: PaginationDto,
    @CurrentMember() member: Member,
  ) {
    const data = await this.groupService.findAllPagination(
      query.skip,
      query.take,
      member.id,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  // //------------------------------
  // @ApiOperation({ summary: 'Get One Group' })
  // @ApiCreatedResponse({
  //   type: GetGroupDto,
  // })
  // @ApiBearerAuth('idp-token')
  // @UseGuards(UserGuard)
  // @Get(':id')
  // async findOne(@Param('id') id: string): Promise<GetGroupDto> {
  //   const result = await this.groupService.findOne({ where: { id } });
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: result,
  //   });
  // }

  // //------------------------------
  // @ApiOperation({ summary: 'Update Group' })
  // @ApiCreatedResponse({
  //   type: GetGroupDto,
  // })
  // @ApiBearerAuth('idp-token')
  // @UseGuards(UserGuard)
  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() data: UpdateGroupDto) {
  //   const result = await this.groupService.update({ id }, data);
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: [result],
  //   });
  // }

  // //----------------------------------
  // @ApiOperation({ summary: 'Remove Group by ID' })
  // @ApiCreatedResponse({
  //   type: GetGroupDto,
  // })
  // @ApiBearerAuth('idp-token')
  // @UseGuards(UserGuard)
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.groupService.remove({ id });
  // }
}
