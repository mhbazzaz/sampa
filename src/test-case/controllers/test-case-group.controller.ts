import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { ModifyPatchRequestBodyInterceptors } from 'src/common/interceptors/modify-patch-request-body.interceptor';
import { CreateTestcaseGroupDto } from '../dto/input/create-test-case-group.dto';
import { FindAllTestcaseGroupDto } from '../dto/input/find-all-test-case-group-quey.dto';
import { UpdateTestcaseGroupDto } from '../dto/input/update-test-case-group.dto';
import { GetTestcaseDto } from '../dto/response/get-test-case.dto';
import { TestcaseGroupService } from '../services/test-case-group.service';

@Controller('')
export class TestcaseGroupController {
  constructor(private readonly testcaseGroupService: TestcaseGroupService) {}

  //------------------------------
  @ApiOperation({ summary: 'Create Test-Case Group' })
  @ApiTags('Admin / Test-Case-Group')
  @UseGuards(AdminGuard)
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @Post('admin/test-case/group')
  async create(@Body() data: CreateTestcaseGroupDto) {
    const result = await this.testcaseGroupService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Test-Case Groups' })
  @ApiTags('Admin / Test-Case-Group')
  @UseGuards(AdminGuard)
  @ApiCreatedResponse({
    type: [GetTestcaseDto],
  })
  @Get('admin/test-case/group')
  async findAll(@Query() query: FindAllTestcaseGroupDto) {
    const result = await this.testcaseGroupService.findAllPagination(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Test-Case Group By ID' })
  @ApiTags('Admin / Test-Case-Group')
  @UseGuards(AdminGuard)
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @Get('admin/test-case/group/:id')
  async findOne(@Param('id') id: string) {
    const result = await this.testcaseGroupService.findOne({
      where: { id },
      relations: { testcaseItems: true },
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Test-Case Groups For User Scope' })
  @ApiTags('Test-Case-Group')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @ApiCreatedResponse({
    type: [GetTestcaseDto],
  })
  @Get('test-case/group')
  async findAllUserScope(@Query() query: FindAllTestcaseGroupDto) {
    const result = await this.testcaseGroupService.findAllPagination(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Test-Case Group By ID For User Scope' })
  @ApiTags('Test-Case-Group')
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @Get('test-case/group/:id')
  async findOneUserScope(@Param('id') id: string) {
    const result = await this.testcaseGroupService.findOne({
      where: { id },
      relations: { testcaseItems: true },
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Update Test-Case Group By Id' })
  @ApiTags('Admin / Test-Case-Group')
  @UseGuards(AdminGuard)
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @Patch('admin/test-case/group/:id')
  async update(@Param('id') id: string, @Body() data: UpdateTestcaseGroupDto) {
    const result = await this.testcaseGroupService.update({ id }, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  //----------------------------------
  @ApiOperation({ summary: 'Remove Test-Case Group By Id' })
  @ApiTags('Admin / Test-Case-Group')
  @UseGuards(AdminGuard)
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @Delete('admin/test-case/group/:id')
  async remove(@Param('id') id: string) {
    return await this.testcaseGroupService.remove(id);
  }
}
