import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { TestCaseComment } from '../entities/test-case-comment.entity';

@Injectable()
export class TestCaseCommentRepository extends AbstractRepository<TestCaseComment> {
  constructor(
    @InjectRepository(TestCaseComment)
    private testCaseCommentRepository: Repository<TestCaseComment>,
    private i18nService: I18nService,
  ) {
    super(testCaseCommentRepository, i18nService);
  }
}
