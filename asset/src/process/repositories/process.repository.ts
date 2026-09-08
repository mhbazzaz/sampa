import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { Process } from '../entities/process.entity';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ProcessRepository extends AbstractRepository<Process> {
  constructor(
    @InjectRepository(Process)
    private processRepository: Repository<Process>,
    private readonly i18nService: I18nService,
  ) {
    super(processRepository, i18nService);
  }
}
