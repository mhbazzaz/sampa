import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { FindAllQueryDto } from '../dto/input/find-all-query-dto';
import { GetMemberDto } from '../dto/response/get-member.dto';
import { Member } from '../entities/member.entity';
import { MemberService } from '../services/member.service';

@ApiTags('Member')
@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  //------------------------------
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('current-member')
  async currentUser(@CurrentMember() member: Member) {
    const data = await this.memberService.memberRoles(member.id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { ...data, ...member },
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Member' })
  @ApiCreatedResponse({
    type: GetMemberDto,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(UserGuard)
  @Get('')
  async findAll(@Query() query: FindAllQueryDto) {
    const data = await this.memberService.findAllPagination(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }
}
