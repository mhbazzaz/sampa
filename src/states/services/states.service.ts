import { Injectable } from '@nestjs/common';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { FindOneOptions, IsNull, Not } from 'typeorm';
import { FindAllStatesQueryDto } from '../dto/input/get-all-states-query-params.dto';
import { State } from '../entities/state.entity';
import { StatesRepository } from '../repositories/state.repository';

@Injectable()
export class StatesService {
  constructor(private readonly statesRepository: StatesRepository) {}

  //------------------------------
  async findOne(data: FindOneOptions<State>): Promise<State | null> {
    return this.statesRepository.findOne(data);
  }

  //------------------------------
  async findAll(query: FindAllStatesQueryDto) {
    const qb = await this.statesRepository.findAllWithFilter(query);

    return { data: qb[0], count: qb[1] };
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.statesRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async findAllOrdered() {
    const [assessmentRequestStates, assessmentLayerStates] = await Promise.all([
      this.statesRepository.findAll({
        where: {
          process: { name: ProcessEnum.AssessmentRequest },
          order: Not(IsNull()),
        },
        order: { order: 'ASC' },
        relations: { process: true },
      }),
      this.statesRepository.findAll({
        where: { process: { name: ProcessEnum.AssessmentLayer } },
        order: { order: 'ASC' },
        relations: { process: true },
      }),
    ]);

    return { assessmentRequestStates, assessmentLayerStates };
  }
}
