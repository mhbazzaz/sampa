import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AssessmentRequestRepository } from 'src/assessment/repositories/assessment-request.repository';
import { RequestSpecItemRepository } from 'src/spec/repositories/request-spec-item.repository';
import { TestcaseItemRepository } from 'src/test-case/repositories/testcase-item.repository';
import { DeepPartial, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { Environment } from '../entities/environment.entity';
import { EnvironmentRepository } from '../repositories/environment.repository';

@Injectable()
export class EnvironmentService {
  constructor(
    private readonly environmentRepository: EnvironmentRepository,
    private readonly assessmentRequestRepository: AssessmentRequestRepository,
    private readonly testcaseItemRepository: TestcaseItemRepository,
    private readonly i18nService: I18nService,
    private readonly requestSpecItemRepository: RequestSpecItemRepository,
  ) {}

  //------------------------------
  async create(data: DeepPartial<Environment>): Promise<Environment> {
    return this.environmentRepository.save(data);
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<Environment>,
  ): Promise<Environment | null> {
    return this.environmentRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.environmentRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<Environment>,
    updateEnvironment: Partial<Environment>,
  ) {
    return this.environmentRepository.update(data, updateEnvironment);
  }

  //------------------------------
  async remove(id: string) {
    const relations = [];
    const assessmentRequests = await this.assessmentRequestRepository.findOne({
      where: { environment: { id } },
    });
    if (assessmentRequests) {
      relations.push(this.i18nService.t('objects.assessment request'));
    }
    const testcaseItem = await this.testcaseItemRepository.findOne({
      where: { environments: { id } },
    });
    if (testcaseItem) {
      relations.push(this.i18nService.t('objects.test case item'));
    }
    const requestSpecItem = await this.requestSpecItemRepository.findOne({
      where: { environments: { id } },
    });
    if (requestSpecItem) {
      relations.push(this.i18nService.t('objects.request spec item'));
    }
    if (relations.length > 0) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_HAS_RELATION', {
          args: {
            property: relations.join(` ${this.i18nService.t('objects.and')} `),
          },
        }),
      );
    }
    return this.environmentRepository.findAndDelete({ id });
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.environmentRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }
}
