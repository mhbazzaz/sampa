import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentMember } from 'src/common/decorators/current-member.decorators';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { Member } from 'src/member/entities/member.entity';
import { CreateTestcaseRemediateDto } from '../dto/input/create-remediate.dto';
import { FindAllRemediateQueryDto } from '../dto/input/find-all-remediate-query.dto';
import { GetTestcaseRemediateDto } from '../dto/response/get-remediate.dto';
import { TestcaseRemediateService } from '../services/test-case-remediate.service';

@ApiTags('Test-Case-Remediate')
@UseGuards(AuthorizationGuard)
@UseGuards(UserGuard)
@Controller('test-case/remediate')
export class TestcaseRemediateController {
  constructor(
    private readonly testcaseRemediateService: TestcaseRemediateService,
  ) {}

  //------------------------------
  @ApiOperation({ summary: 'Create Test-Case Remediate' })
  @ApiCreatedResponse({
    type: GetTestcaseRemediateDto,
  })
  @Post('')
  async create(
    @CurrentMember() member: Member,
    @Body() data: CreateTestcaseRemediateDto,
  ) {
    const result = await this.testcaseRemediateService.create(member, data);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get All Test-Case Remediate' })
  @ApiCreatedResponse({
    type: [GetTestcaseRemediateDto],
  })
  @Get('')
  async findAll(@Query() query: FindAllRemediateQueryDto) {
    const result = await this.testcaseRemediateService.findAllFiltered(query);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }

  //------------------------------
  @ApiOperation({ summary: 'Get One Test-Case Remediate By Id' })
  @ApiCreatedResponse({
    type: GetTestcaseRemediateDto,
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.testcaseRemediateService.findOne({
      where: { id },
      relations: { testcaseContent: true },
    });
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: result,
    });
  }
}
