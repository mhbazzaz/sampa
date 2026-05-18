import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Filter } from 'src/filter/entities/filter.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FilterRepository extends AbstractRepository<Filter> {
  constructor(
    @InjectRepository(Filter)
    private filterRepository: Repository<Filter>,
    private readonly i18nService: I18nService,
  ) {
    super(filterRepository, i18nService);
  }
}
