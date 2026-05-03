import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { RequestSpecGroup } from '../entities/request-spec-group.entity';

@Injectable()
export class RequestSpecGroupRepository extends AbstractRepository<RequestSpecGroup> {
  constructor(
    @InjectRepository(RequestSpecGroup)
    private requestSpecGroupRepository: Repository<RequestSpecGroup>,
    private readonly i18nService: I18nService,
  ) {
    super(requestSpecGroupRepository, i18nService);
  }
}
