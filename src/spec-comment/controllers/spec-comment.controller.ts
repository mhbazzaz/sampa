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
import { CreateSpecCommentDto } from '../dto/input/create-spec-comment.dto';
import { SpecCommentService } from '../services/spec-comment.service';

@ApiTags('Spec-Comment')
@Controller('spec-comment')
export class SpecCommentController {
  constructor(
    private readonly testCaseSpecCommentService: SpecCommentService,
  ) {}

  //------------------------------
  @ApiOperation({
    summary: `Create Spec Comment, ${ActionEnum.CreateSpecComment} | ${ProcessEnum.AssessmentLayer}`,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, ActionEnum.CreateSpecComment)
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Post('')
  async create(
    @Body() data: CreateSpecCommentDto,
    @CurrentMember() member: Member,
  ) {
    const result = await this.testCaseSpecCommentService.create(data, member);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Create Spec Comment, ${ActionEnum.GetSpecComment} | ${ProcessEnum.AssessmentLayer}`,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, ActionEnum.GetSpecComment)
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Get(':id')
  async findAll(@Query() query: PaginationDto, @Param('id') specId: string) {
    const data = await this.testCaseSpecCommentService.findAllPagination(
      query.skip,
      query.take,
      specId,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Delete Spec Comment, ${ActionEnum.DeleteSpecComment} | ${ProcessEnum.AssessmentLayer}`,
  })
  @ApiBearerAuth('idp-token')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, ActionEnum.DeleteSpecComment)
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.testCaseSpecCommentService.remove({ id });
  }
}
