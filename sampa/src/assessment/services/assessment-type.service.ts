import { Injectable } from '@nestjs/common';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';
import { AssessmentType } from '../entities/assessment-type.entity';
import { AssessmentTypeRepository } from '../repositories/assessment-type.repository';

@Injectable()
export class AssessmentTypeService {
  constructor(
    private readonly assessmentTypeRepository: AssessmentTypeRepository,
  ) {}

  //------------------------------
  async findOne(
    data: FindOneOptions<AssessmentType>,
  ): Promise<AssessmentType | null> {
    return this.assessmentTypeRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.assessmentTypeRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<AssessmentType>,
    updateAssessmentType: Partial<AssessmentType>,
  ) {
    return this.assessmentTypeRepository.update(data, updateAssessmentType);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<AssessmentType>) {
    return this.assessmentTypeRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.assessmentTypeRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async findAllPaginationAdminScope(skip: number, take: number) {
    return this.assessmentTypeRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }
}
