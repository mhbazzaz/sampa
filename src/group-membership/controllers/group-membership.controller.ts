import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { IsUUIDPipe } from 'src/common/pipes/parse-uuid.pipe';
import { Member } from 'src/member/entities/member.entity';
import { CreateGroupMembershipDto } from '../dto/input/create-group-membership.dto';
import { UpdateGroupMembershipDto } from '../dto/input/update-group-membership.dto';
import { GetGroupMembershipDto } from '../dto/response/get-group-membership.dto';
import { GroupMembershipService } from '../services/group-membership.service';

@ApiTags('Group-Memberships')
@Controller('group-membership')
export class GroupMembershipController {
  constructor(
    private readonly groupMembershipService: GroupMembershipService,
  ) {}

  //------------------------------
  @ApiOperation({
    summary: `Create Group Membership, ${ActionEnum.ApplicantManagerTeamup} | ${ProcessEnum.AssessmentRequest}`,
  })
  @ApiCreatedResponse({
    type: GetGroupMembershipDto,
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
    @Body() data: CreateGroupMembershipDto,
  ): Promise<GetGroupMembershipDto> {
    const result = await this.groupMembershipService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  // //------------------------------
  // @ApiOperation({ summary: 'Get All Group Membership' })
  // @ApiCreatedResponse({
  //   type: GetGroupMembershipDto,
  // })
  // @ApiBearerAuth('idp-token')
  // @UseGuards(UserGuard)
  // @Get('')
  // async findAll(@Query() query: PaginationDto) {
  //   const data = await this.groupMembershipService.findAllPagination(
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
  // @ApiOperation({ summary: 'Get One Group Membership' })
  // @ApiCreatedResponse({
  //   type: GetGroupMembershipDto,
  // })
  // @ApiBearerAuth('idp-token')
  // @UseGuards(UserGuard)
  // @Get(':id')
  // async findOne(@Param('id') id?: string): Promise<GetGroupMembershipDto> {
  //   const result = await this.groupMembershipService.findOne({ where: { id } });
  //   return responseGenerator({
  //     statusCode: 200,
  //     message: 'successful',
  //     data: result,
  //   });
  // }

  //------------------------------
  @ApiOperation({
    summary: `Get Membership Of Group With Group-Id, ${ActionEnum.ApplicantManagerTeamup} | ${ProcessEnum.AssessmentRequest}`,
  })
  @ApiCreatedResponse({
    type: GetGroupMembershipDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(
    AuthorizationMetaDataEnum.Action,
    ActionEnum.ApplicantManagerTeamup,
  )
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get('group-members/:groupId')
  async findOneWithGroupId(
    @Param('groupId', IsUUIDPipe) groupId: string,
  ): Promise<GetGroupMembershipDto> {
    const result =
      await this.groupMembershipService.findOneWithGroupId(groupId);

    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Update Group Membership, ${ActionEnum.ApplicantManagerTeamup} | ${ProcessEnum.AssessmentRequest}`,
  })
  @ApiCreatedResponse({
    type: GetGroupMembershipDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(
    AuthorizationMetaDataEnum.Action,
    ActionEnum.ApplicantManagerTeamup,
  )
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Patch()
  async update(
    @Body() data: UpdateGroupMembershipDto,
    @CurrentMember() member: Member,
  ) {
    const result = await this.groupMembershipService.update(data, member);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  // //----------------------------------
  // @ApiOperation({ summary: 'Remove Group Membership by ID' })
  // @ApiCreatedResponse({
  //   type: GetGroupMembershipDto,
  // })
  // @ApiBearerAuth('idp-token')
  // @UseGuards(UserGuard)
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.groupMembershipService.remove({ id });
  // }
}
