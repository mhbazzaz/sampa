import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { TestcaseRemediate } from '../entities/test-case-remediate.entity';

@Injectable()
export class TestcaseRemediateRepository extends AbstractRepository<TestcaseRemediate> {
  constructor(
    @InjectRepository(TestcaseRemediate)
    private testcaseRemediateRepository: Repository<TestcaseRemediate>,
    private i18nService: I18nService,
  ) {
    super(testcaseRemediateRepository, i18nService);
  }
}
