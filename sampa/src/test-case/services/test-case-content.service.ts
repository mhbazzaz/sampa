import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ActionLogBufferService } from 'src/action-log/services/action-log-buffer.service';
import { AssessmentRequestRepository } from 'src/assessment/repositories/assessment-request.repository';
import { EntityTypeEnum } from 'src/common/enums/entity-type.enum';
import { ContentStatus } from 'src/common/enums/test-case-content-status.enum';
import { ContentCriticality } from 'src/common/enums/test-case-criticality.enum';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';
import { CreateTestcaseContentDto } from '../dto/input/create-test-case-content.dto';
import { UpdateTestcaseContentDto } from '../dto/input/update-test-case-content.dto';
import { TestcaseContent } from '../entities/testcase-content.entity';
import { TestcaseContentRepository } from '../repositories/test-case-content.repository';
import { TestcaseItemRepository } from '../repositories/testcase-item.repository';
@Injectable()
export class TestcaseContentService {
  constructor(
    private readonly testcaseContentRepository: TestcaseContentRepository,
    private readonly testcaseItemRepository: TestcaseItemRepository,
    private readonly assessmentRequestRepository: AssessmentRequestRepository,
    private readonly i18nService: I18nService,
    private readonly actionLogBufferService: ActionLogBufferService,
  ) {}

  //------------------------------
  async create(data: CreateTestcaseContentDto): Promise<TestcaseContent> {
    const { status, criticality } = data;

    const disallowedCriticalityStatuses = [
      ContentStatus.NotApplicable,
      ContentStatus.Accepted,
    ];

    const requiredCriticalityStatuses = [
      ContentStatus.NotPerforming,
      ContentStatus.Failed,
    ];

    if (disallowedCriticalityStatuses.includes(status)) {
      if (criticality !== undefined && criticality !== null) {
        throw new BadRequestException(
          'Criticality must not be provided when status is notApplicable or accepted.',
        );
      }

      delete data.criticality;
    } else if (requiredCriticalityStatuses.includes(status)) {
      if (criticality === undefined || criticality === null) {
        throw new BadRequestException(
          'Criticality is required when status is notPerforming or failed.',
        );
      }
      if (!Object.values(ContentCriticality).includes(criticality)) {
        throw new BadRequestException('Invalid criticality value.');
      }
    }

    return this.testcaseContentRepository.save(data);
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<TestcaseContent>,
  ): Promise<TestcaseContent | null> {
    return this.testcaseContentRepository.findOne({
      ...data,
      relations: { assessmentRequest: true, testcaseItem: true },
    });
  }

  //------------------------------
  async findAll() {
    return this.testcaseContentRepository.findAll({
      relations: { assessmentRequest: true, testcaseItem: true },
      order: { createdAt: 'ASC' },
    });
  }

  //------------------------------
  async update(
    id: FindOptionsWhere<TestcaseContent>,
    dto: UpdateTestcaseContentDto,
    userId?: string,
    ipAddress?: string,
  ): Promise<TestcaseContent> {
    const updatePayload: Partial<TestcaseContent> = {};
    const beforeEntity = await this.testcaseContentRepository.findOne({
      where: id,
      relations: { assessmentRequest: true },
    });

    for (const [key, value] of Object.entries(dto)) {
      const typedKey = key as keyof UpdateTestcaseContentDto;

      if (value !== undefined) {
        switch (typedKey) {
          case 'assessmentRequestId': {
            const request = await this.assessmentRequestRepository.findOne({
              where: { id: value },
            });
            if (!request) {
              throw new BadRequestException(
                this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
                  args: { value, property: 'AssessmentRequest' },
                }),
              );
            }
            updatePayload.assessmentRequest = request;
            break;
          }

          case 'testcaseItemId': {
            const testcaseItem = await this.testcaseItemRepository.findOne({
              where: { id: value },
            });
            if (!testcaseItem) {
              throw new BadRequestException(
                this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
                  args: { value, property: 'TestcaseItem' },
                }),
              );
            }
            updatePayload.testcaseItem = testcaseItem;
            break;
          }

          default:
            updatePayload[typedKey] = value;
            break;
        }
      }
    }

    const { status, criticality } = dto;

    if (status !== undefined) {
      const disallowedCriticalityStatuses = [
        ContentStatus.NotApplicable,
        ContentStatus.Accepted,
      ];

      const requiredCriticalityStatuses = [
        ContentStatus.NotPerforming,
        ContentStatus.Failed,
      ];

      if (disallowedCriticalityStatuses.includes(status)) {
        if (criticality !== undefined) {
          throw new BadRequestException(
            'Criticality must not be provided when status is notApplicable or accepted.',
          );
        }
      } else if (requiredCriticalityStatuses.includes(status)) {
        if (criticality === undefined) {
          throw new BadRequestException(
            'Criticality is required when status is notPerforming or failed.',
          );
        }
      }
    }

    const updated = await this.testcaseContentRepository.update(
      id,
      updatePayload,
    );

    if (beforeEntity && userId && beforeEntity.assessmentRequestId) {
      await this.actionLogBufferService.addChange(
        {
          assessmentRequestId: beforeEntity.assessmentRequestId,
        },
        {
          entityType: EntityTypeEnum.Testcase,
          beforeEntity,
          updateDto: dto,
          userId,
          ipAddress,
          assessmentRequestCurrentStateId:
            beforeEntity.assessmentRequest?.stateId ?? null,
          assessmentRequestNextStateId:
            updatePayload.assessmentRequest?.stateId ??
            beforeEntity.assessmentRequest?.stateId ??
            null,
          assessmentLayerCurrentStateId: null,
          assessmentLayerNextStateId: null,
        },
      );
    }

    return updated;
  }

  //------------------------------
  async remove(id: string) {
    return this.testcaseContentRepository.findAndDelete({ id });
  }

  //------------------------------
  async findAllPagination(query: PaginationDto) {
    return this.testcaseContentRepository.findAllPagination(
      query.skip,
      query.take,
      {
        relations: { assessmentRequest: true, testcaseItem: true },
        order: { createdAt: 'ASC' },
      },
    );
  }
}
