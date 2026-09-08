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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { Member } from 'src/member/entities/member.entity';
import { CreateTestCaseCommentDto } from '../dto/input/create-test-case-comment.dto';
import { TestCaseCommentService } from '../services/test-case-comment.service';

@ApiTags('Test-Case-Comment')
@Controller('test-case-comment')
export class TestCaseCommentController {
  constructor(
    private readonly testCaseCommentService: TestCaseCommentService,
  ) {}

  //------------------------------
  @ApiOperation({
    summary: `Create Test-Case Comment, ${ActionEnum.CreateTestCaseComment} | ${ProcessEnum.AssessmentLayer}`,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(
    AuthorizationMetaDataEnum.Action,
    ActionEnum.CreateTestCaseComment,
  )
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Post('')
  async create(
    @Body() data: CreateTestCaseCommentDto,
    @CurrentMember() member: Member,
  ) {
    const result = await this.testCaseCommentService.create(data, member);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Create Test-Case Comment, ${ActionEnum.GetTestCaseComment} | ${ProcessEnum.AssessmentLayer}`,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, ActionEnum.GetTestCaseComment)
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Get(':id')
  async findAll(
    @Query() query: PaginationDto,
    @Param('id') testCaseId: string,
  ) {
    const data = await this.testCaseCommentService.findAllPagination(
      query.skip,
      query.take,
      testCaseId,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Delete Test-Case Comment, ${ActionEnum.DeleteTestCaseComment} | ${ProcessEnum.AssessmentLayer}`,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(
    AuthorizationMetaDataEnum.Action,
    ActionEnum.DeleteTestCaseComment,
  )
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.testCaseCommentService.remove({ id });
  }
}
