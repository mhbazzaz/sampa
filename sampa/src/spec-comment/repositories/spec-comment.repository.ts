import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { SpecComment } from '../entities/spec-comment.entity';

@Injectable()
export class SpecCommentRepository extends AbstractRepository<SpecComment> {
  constructor(
    @InjectRepository(SpecComment)
    private specCommentRepository: Repository<SpecComment>,
    private i18nService: I18nService,
  ) {
    super(specCommentRepository, i18nService);
  }
}
