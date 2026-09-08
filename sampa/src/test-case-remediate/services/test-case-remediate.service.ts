import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ActionLogBufferService } from 'src/action-log/services/action-log-buffer.service';
import { EntityTypeEnum } from 'src/common/enums/entity-type.enum';
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
    private readonly actionLogBufferService: ActionLogBufferService,
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
      relations: { assessmentRequest: true },
    });

    if (!existingContent) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'test case content' },
        }),
      );
    }

    const created = await this.testcaseRemediateRepository.save({
      ...data,
      memberId: member.id,
    });

    if (existingContent.assessmentRequestId) {
      await this.actionLogBufferService.addChange(
        { assessmentRequestId: existingContent.assessmentRequestId },
        {
          entityType: EntityTypeEnum.Remediate,
          beforeEntity: {},
          updateDto: data,
          userId: member.id,
          assessmentRequestCurrentStateId:
            existingContent.assessmentRequest?.stateId ?? null,
          assessmentRequestNextStateId:
            existingContent.assessmentRequest?.stateId ?? null,
          assessmentLayerCurrentStateId: null,
          assessmentLayerNextStateId: null,
        },
      );
    }

    return created;
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
      order: { createdAt: 'DESC' },
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
