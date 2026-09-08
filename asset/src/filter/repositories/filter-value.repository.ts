import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { FilterValue } from '../entities/filter-value.entity';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class FilterValueRepository extends AbstractRepository<FilterValue> {
  constructor(
    @InjectRepository(FilterValue)
    private filterValueRepository: Repository<FilterValue>,
    private readonly i18nService: I18nService,
  ) {
    super(filterValueRepository, i18nService);
  }
}
