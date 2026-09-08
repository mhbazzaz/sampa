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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { ModifyPatchRequestBodyInterceptors } from 'src/common/interceptors/modify-patch-request-body.interceptor';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { CreateTestcaseContentDto } from '../dto/input/create-test-case-content.dto';
import { UpdateTestcaseContentDto } from '../dto/input/update-test-case-content.dto';
import { GetTestcaseDto } from '../dto/response/get-test-case.dto';
import { TestcaseContentService } from '../services/test-case-content.service';
import { Member } from 'src/member/entities/member.entity';

@Controller('')
export class TestcaseContentController {
  constructor(
    private readonly testcaseContentService: TestcaseContentService,
  ) {}

  //------------------------------
  @ApiTags('Admin / Test-Case-Content')
  @ApiOperation({ summary: 'Create Test-Case Content' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AdminGuard)
  @Post('admin/test-case/content')
  async createAdminScope(@Body() data: CreateTestcaseContentDto) {
    const result = await this.testcaseContentService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Test-Case-Content')
  @ApiOperation({ summary: 'Create Test-Case Content' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Post('test-case/content')
  async createUserScope(@Body() data: CreateTestcaseContentDto) {
    const result = await this.testcaseContentService.create(data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Test-Case-Content')
  @ApiOperation({ summary: 'Get All Test-Case Contents' })
  @ApiCreatedResponse({
    type: [GetTestcaseDto],
  })
  @UseGuards(AdminGuard)
  @Get('admin/test-case/content')
  async findAllAdminScope(@Query() query: PaginationDto) {
    const result = await this.testcaseContentService.findAllPagination(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Test-Case-Content')
  @ApiOperation({ summary: 'Get All Test-Case Contents' })
  @ApiCreatedResponse({
    type: [GetTestcaseDto],
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Get('test-case/content')
  async findAllUserScope(@Query() query: PaginationDto) {
    const result = await this.testcaseContentService.findAllPagination(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { data: result[0], count: result[1] },
    });
  }

  //------------------------------
  @ApiTags('Admin / Test-Case-Content')
  @ApiOperation({ summary: 'Get One Test-Case Content By ID' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AdminGuard)
  @Get('admin/test-case/content/:id')
  async findOneAdminScope(@Param('id') id: string) {
    const result = await this.testcaseContentService.findOne({
      where: { id },
      relations: { testcaseItem: true },
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Test-Case-Content')
  @ApiOperation({ summary: 'Get One Test-Case Content By Id' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Get('test-case/content/:id')
  async findOneUserScope(@Param('id') id: string) {
    const result = await this.testcaseContentService.findOne({
      where: { id },
      relations: { testcaseItem: true },
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiTags('Admin / Test-Case-Content')
  @ApiOperation({ summary: 'Update Test-Case Content By Id' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AdminGuard)
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @Patch('admin/test-case/content/:id')
  async updateAdminScope(
    @Param('id') id: string,
    @Body() data: UpdateTestcaseContentDto,
    @CurrentMember() member: Member,
  ) {
    const result = await this.testcaseContentService.update(
      { id },
      data,
      member.id,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  //------------------------------
  @ApiTags('Test-Case-Content')
  @ApiOperation({ summary: 'Update Test-Case Content By Id' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @UseInterceptors(ModifyPatchRequestBodyInterceptors)
  @Patch('test-case/content/:id')
  async updateUserScope(
    @Param('id') id: string,
    @Body() data: UpdateTestcaseContentDto,
    @CurrentMember() member: Member,
  ) {
    const result = await this.testcaseContentService.update(
      { id },
      data,
      member.id,
    );
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: [result],
    });
  }

  //------------------------------
  @ApiTags('Admin / Test-Case-Content')
  @ApiOperation({ summary: 'Remove Test-Case Content By Id' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AdminGuard)
  @Delete('admin/test-case/content/:id')
  async removeAdminScope(@Param('id') id: string) {
    return await this.testcaseContentService.remove(id);
  }

  //------------------------------
  @ApiTags('Test-Case-Content')
  @ApiOperation({ summary: 'Remove Test-Case Content By Id' })
  @ApiCreatedResponse({
    type: GetTestcaseDto,
  })
  @UseGuards(AuthorizationGuard)
  @UseGuards(UserGuard)
  @Delete('test-case/content/:id')
  async removeUserScope(@Param('id') id: string) {
    return await this.testcaseContentService.remove(id);
  }
}
