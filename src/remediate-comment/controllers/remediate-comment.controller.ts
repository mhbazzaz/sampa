import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { Member } from 'src/member/entities/member.entity';
import { CreateRemediateCommentDto } from '../dto/input/create-remediate-comment.dto';
import { RemediateCommentService } from '../services/remediate-comment.service';

@ApiTags('Remediate-Comment')
@Controller('remediate-comment')
export class RemediateCommentController {
  constructor(
    private readonly remediateCommentService: RemediateCommentService,
  ) {}

  //------------------------------
  @ApiOperation({
    summary: `Create Remediate Comment, ${ActionEnum.CreateRemediateComment} | ${ProcessEnum.AssessmentLayer}`,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(
    AuthorizationMetaDataEnum.Action,
    ActionEnum.CreateRemediateComment,
  )
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Post('')
  async create(
    @Body() data: CreateRemediateCommentDto,
    @CurrentMember() member: Member,
  ) {
    const result = await this.remediateCommentService.create(data, member);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Get Remediate Comment, ${ActionEnum.GetRemediateComment} | ${ProcessEnum.AssessmentLayer}`,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, ActionEnum.GetRemediateComment)
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Get(':id')
  async findAll(
    @Query() query: PaginationDto,
    @Param('id') remediateId: string,
  ) {
    const data = await this.remediateCommentService.findAllPagination(
      query.skip,
      query.take,
      remediateId,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Delete Remediate Comment, ${ActionEnum.DeleteRemediateComment} | ${ProcessEnum.AssessmentLayer}`,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(
    AuthorizationMetaDataEnum.Action,
    ActionEnum.DeleteRemediateComment,
  )
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.remediateCommentService.remove({ id });
  }
}
