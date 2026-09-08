import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { RequestSpecContent } from '../entities/request-spec-content.entity';

@Injectable()
export class RequestSpecContentRepository extends AbstractRepository<RequestSpecContent> {
  constructor(
    @InjectRepository(RequestSpecContent)
    private requestSpecContentRepository: Repository<RequestSpecContent>,
    private i18nService: I18nService,
  ) {
    super(requestSpecContentRepository, i18nService);
  }
}
