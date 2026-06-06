import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { LayerCommentService } from '../services/layer-comment.service';

@ApiTags('Layer-Comment')
@Controller('layer-comment')
export class LayerCommentController {
  constructor(
    private readonly testCaseLayerCommentService: LayerCommentService,
  ) {}

  //------------------------------
  @ApiOperation({
    summary: `Create Layer Comment, ${ActionEnum.GetLayerComment} | ${ProcessEnum.AssessmentLayer}`,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, ActionEnum.GetLayerComment)
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Get(':id')
  async findAll(@Query() query: PaginationDto, @Param('id') layerId: string) {
    const data = await this.testCaseLayerCommentService.findAllPagination(
      query.skip,
      query.take,
      layerId,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  //------------------------------
  @ApiOperation({
    summary: `Delete Layer Comment, ${ActionEnum.DeleteLayerComment} | ${ProcessEnum.AssessmentLayer}`,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, ActionEnum.DeleteLayerComment)
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.testCaseLayerCommentService.remove({ id });
  }
}
