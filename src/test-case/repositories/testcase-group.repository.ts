import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { TestcaseGroup } from '../entities/testcase-group.entity';

@Injectable()
export class TestcaseGroupRepository extends AbstractRepository<TestcaseGroup> {
  constructor(
    @InjectRepository(TestcaseGroup)
    private testcaseGroupRepository: Repository<TestcaseGroup>,
    private i18nService: I18nService,
  ) {
    super(testcaseGroupRepository, i18nService);
  }
}
