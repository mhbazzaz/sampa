import { Injectable } from '@nestjs/common';
import { DeepPartial, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { AssessmentTeam } from '../entities/assessment-team.entity';
import { AssessmentTeamRepository } from '../repositories/assessment-team.repository';

@Injectable()
export class AssessmentTeamService {
  constructor(
    private readonly assessmentTeamRepository: AssessmentTeamRepository,
  ) {}

  //------------------------------
  async create(data: DeepPartial<AssessmentTeam>): Promise<AssessmentTeam> {
    return this.assessmentTeamRepository.save(data);
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<AssessmentTeam>,
  ): Promise<AssessmentTeam | null> {
    return this.assessmentTeamRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.assessmentTeamRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<AssessmentTeam>,
    updateAssessmentTeam: Partial<AssessmentTeam>,
  ) {
    return this.assessmentTeamRepository.update(data, updateAssessmentTeam);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<AssessmentTeam>) {
    return this.assessmentTeamRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.assessmentTeamRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }
}
