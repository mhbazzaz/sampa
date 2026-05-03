import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { RemediateComment } from '../entities/remediate-comment.entity';

@Injectable()
export class RemediateCommentRepository extends AbstractRepository<RemediateComment> {
  constructor(
    @InjectRepository(RemediateComment)
    private remediateCommentRepository: Repository<RemediateComment>,
    private i18nService: I18nService,
  ) {
    super(remediateCommentRepository, i18nService);
  }
}
