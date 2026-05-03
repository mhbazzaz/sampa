import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { AssessmentType } from '../entities/assessment-type.entity';

@Injectable()
export class AssessmentTypeRepository extends AbstractRepository<AssessmentType> {
  constructor(
    @InjectRepository(AssessmentType)
    private assessmentTypeRepository: Repository<AssessmentType>,
    private i18nService: I18nService,
  ) {
    super(assessmentTypeRepository, i18nService);
  }
}
