import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { Environment } from '../entities/environment.entity';

@Injectable()
export class EnvironmentRepository extends AbstractRepository<Environment> {
  constructor(
    @InjectRepository(Environment)
    private environmentRepository: Repository<Environment>,
    private i18nService: I18nService,
  ) {
    super(environmentRepository, i18nService);
  }
}
