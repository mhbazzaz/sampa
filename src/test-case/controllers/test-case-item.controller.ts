import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  SetMetadata,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentMemberRoles } from 'src/common/decorators/current-member-roles.decorators';
import { ActionEnum } from 'src/common/enums/action.enum';
import { AuthorizationMetaDataEnum } from 'src/common/enums/authorization-meta-data.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { ModifyPatchRequestBodyInterceptors } from 'src/common/interceptors/modify-patch-request-body.interceptor';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { Role } from 'src/role/entities/role.entity';
import { CreateTestcaseItemDto } from '../dto/input/create-test-case-item.dto';
import { FindFilteredTestcaseItemQueryDto } from '../dto/input/find-filtered-test-case-item.dto';
import { UpdateTestcaseItemDto } from '../dto/input/update-test-case-item.dto';
import { GetTestcaseDto } from '../dto/response/get-test-case.dto';
import { TestcaseItemService } from '../services/test-case-item.service';

@Controller('')
export class TestcaseItemController {
  constructor(private readonly testcaseItemService: TestcaseItemService) {}

  //------------------------------
  @ApiTags('Admin / Test-Case-Item')
  @ApiOperation({ summary: 'Create Test Case Item' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AdminGuard)
  @Post('admin/test-case/item')
  async createAdminScope(
    @Body() data: CreateTestcaseItemDto,
  ): Promise<GetTestcaseDto> {
    const result = await this.testcaseItemService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Test-Case-Item')
  @ApiOperation({ summary: 'Create Test Case Item' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Post('test-case/item')
  async createUserScope(
    @Body() data: CreateTestcaseItemDto,
  ): Promise<GetTestcaseDto> {
    const result = await this.testcaseItemService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Test-Case-Item')
  @ApiOperation({ summary: 'Get All Test Case Item' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AdminGuard)
  @Get('admin/test-case/item')
  async findAll(@Query() query: PaginationDto) {
    const data = await this.testcaseItemService.findAllPagination(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: data[0], count: data[1] },
    });
  }

  //------------------------------
  @ApiTags('Admin / Test-Case-Item')
  @ApiOperation({
    summary:
      'Get Test Case Items With Filter On TestCaseGroupId and EnvironmentId and TestCaseId and AssessmentTypeId and AssetTypeId',
  })
  @ApiCreatedResponse({
    type: [GetTestcaseDto],
  })
  @UseGuards(AdminGuard)
  @Get('admin/test-case/item/filtered')
  async getFiltered(@Query() query: FindFilteredTestcaseItemQueryDto) {
    const result =
      await this.testcaseItemService.getFilteredTestcaseItems(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Admin / Test-Case-Item')
  @ApiOperation({ summary: 'Get One Test Case Item By Id' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AdminGuard)
  @Get('admin/test-case/item/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.testcaseItemService.findOne(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data,
    });
  }

  //------------------------------
  @ApiTags('Test-Case-Item')
  @ApiCreatedResponse({
    type: [GetTestcaseDto],
  })
  @UseGuards(AuthorizationGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.PendingLayerTestcasesSubmit,
    ActionEnum.LayerAssessmentCompletedAccept,
    ActionEnum.LayerReEvaluationRequestedAccept,
    ActionEnum.LayerAssessmentReviewAccept,
    ActionEnum.RemediateLayerVulnerabilitiesFinalize,
    ActionEnum.ReviewLayerRemediatesApprove,
    ActionEnum.LayerReportIssuedRefer,
    ActionEnum.LayerAssessmentFulfilledReinstate,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentLayer)
  @UseGuards(UserGuard)
  @Get('test-case/layer-item/filtered')
  async getFilteredUserScope(@Query() query: FindFilteredTestcaseItemQueryDto) {
    const result =
      await this.testcaseItemService.getFilteredTestcaseItems(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Test-Case-Item')
  @ApiCreatedResponse({
    type: [GetTestcaseDto],
  })
  @UseGuards(AuthorizationGuard)
  @SetMetadata(AuthorizationMetaDataEnum.Action, [
    ActionEnum.ReadTestCaseAfterFirstIteration,
    ActionEnum.StatusReportedFinalize,
  ])
  @SetMetadata(AuthorizationMetaDataEnum.Process, ProcessEnum.AssessmentRequest)
  @UseGuards(UserGuard)
  @Get('test-case/request-item/filtered')
  async getFilteredRequestUserScope(
    @Query() query: FindFilteredTestcaseItemQueryDto,
    @CurrentMemberRoles() memberRoles: Role[],
  ) {
    const result = await this.testcaseItemService.getFilteredRequestUserScope(
      query,
      memberRoles,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Test-Case-Item')
  @ApiOperation({ summary: 'Get One Test Case Item By Id For User Scope' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Get('test-case/item/:id')
  async findOneUserScope(@Param('id') id: string) {
    const data = await this.testcaseItemService.findOne(id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data,
    });
  }

  //------------------------------
  @ApiTags('Admin / Test-Case-Item')
  @ApiOperation({ summary: 'Update Test Case Item' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AdminGuard)
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @Patch('admin/test-case/item/:id')
  async updateAdminScope(
    @Param('id') id: string,
    @Body() data: UpdateTestcaseItemDto,
  ) {
    const result = await this.testcaseItemService.update({ id }, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Test-Case-Item')
  @ApiOperation({ summary: 'Update Test Case Item' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @Patch('test-case/item/:id')
  async updateUserScope(
    @Param('id') id: string,
    @Body() data: UpdateTestcaseItemDto,
  ) {
    const result = await this.testcaseItemService.update({ id }, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //----------------------------------
  @ApiTags('Admin / Test-Case-Item')
  @ApiOperation({
    summary: 'Remove Test Case Item And Relations By Request-Spec-Item ID',
  })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AdminGuard)
  @Delete('admin/test-case/item/:id')
  remove(@Param('id') id: string) {
    return this.testcaseItemService.remove(id);
  }
}
