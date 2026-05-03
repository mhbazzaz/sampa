import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { RequestComment } from '../entities/request-comment.entity';

@Injectable()
export class RequestCommentRepository extends AbstractRepository<RequestComment> {
  constructor(
    @InjectRepository(RequestComment)
    private requestCommentRepository: Repository<RequestComment>,
    private i18nService: I18nService,
  ) {
    super(requestCommentRepository, i18nService);
  }
}
