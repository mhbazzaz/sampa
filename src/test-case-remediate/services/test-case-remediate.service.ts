import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { TestCaseRemediateApproachEnum } from 'src/common/enums/test-case-remediate-approach.enum';
import { Member } from 'src/member/entities/member.entity';
import { TestcaseContentRepository } from 'src/test-case/repositories/test-case-content.repository';
import { FindOneOptions } from 'typeorm';
import { CreateTestcaseRemediateDto } from '../dto/input/create-remediate.dto';
import { FindAllRemediateQueryDto } from '../dto/input/find-all-remediate-query.dto';
import { TestcaseRemediate } from '../entities/test-case-remediate.entity';
import { TestcaseRemediateRepository } from '../repositories/test-case-remediate.repository';

@Injectable()
export class TestcaseRemediateService {
  constructor(
    private readonly testcaseRemediateRepository: TestcaseRemediateRepository,
    private readonly testcaseContentRepository: TestcaseContentRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(member: Member, data: CreateTestcaseRemediateDto) {
    if (data.approach === TestCaseRemediateApproachEnum.Rejection) {
      if (!data.reason || data.reason.trim() === '') {
        throw new BadRequestException(
          this.i18nService.t('validation.IsNotEmpty', {
            args: { property: 'reason' },
          }),
        );
      }
    } else {
      if (!data.solution || data.solution.trim() === '') {
        throw new BadRequestException(
          this.i18nService.t('validation.IsNotEmpty', {
            args: { property: 'solution' },
          }),
        );
      }
    }

    const existingContent = await this.testcaseContentRepository.findOne({
      where: { id: data.testcaseContentId },
    });

    if (!existingContent) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'test case content' },
        }),
      );
    }

    return await this.testcaseRemediateRepository.save({
      ...data,
      memberId: member.id,
    });
  }

  //------------------------------
  async findAllFiltered(query: FindAllRemediateQueryDto) {
    return await this.testcaseRemediateRepository.findAll({
      where: {
        ...(query.testcaseContentId && {
          testcaseContent: {
            id: query.testcaseContentId,
          },
        }),
      },
      relations: { testcaseContent: true, member: true },
      order: { createdAt: 'ASC' },
    });
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<TestcaseRemediate>,
  ): Promise<TestcaseRemediate | null> {
    return await this.testcaseRemediateRepository.findOne({
      ...data,
    });
  }
}
