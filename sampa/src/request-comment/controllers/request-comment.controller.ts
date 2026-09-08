import {
  Body,
  Controller,
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
import { CreateRequestCommentDto } from '../dto/input/create-request-comment.dto';
import { RequestCommentService } from '../services/request-comment.service';

@ApiTags('Request-Comment')
@Controller('request-comment')
export class RequestCommentController {
  constructor(
    private readonly testCaseRequestCommentService: RequestCommentService,
  ) {}

  //------------------------------
  @ApiOperation({
    summary: `Create Request Comment, ${ActionEnum.CreateRequestComment} | ${ProcessEnum.AssessmentRequest}`,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(
    AuthorizationMetaDataEnum.Action,
    ActionEnum.CreateRequestComment,
  )
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Post('')
  async create(
    @Body() data: CreateRequestCommentDto,
    @CurrentMember() member: Member,
  ) {
    const result = await this.testCaseRequestCommentService.create(
      data,
      member,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Create Request Comment, ${ActionEnum.GetRequestComment} | ${ProcessEnum.AssessmentRequest}`,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, ActionEnum.GetRequestComment)
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @Get(':id')
  async findAll(@Query() query: PaginationDto, @Param('id') requestId: string) {
    const data = await this.testCaseRequestCommentService.findAllPagination(
      query.skip,
      query.take,
      requestId,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }
}
