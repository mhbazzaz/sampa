import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { TestcaseContent } from '../entities/testcase-content.entity';

@Injectable()
export class TestcaseContentRepository extends AbstractRepository<TestcaseContent> {
  constructor(
    @InjectRepository(TestcaseContent)
    private testcaseContentRepository: Repository<TestcaseContent>,
    private i18nService: I18nService,
  ) {
    super(testcaseContentRepository, i18nService);
  }
}
