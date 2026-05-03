import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { FindAllStatesQueryDto } from '../dto/input/get-all-states-query-params.dto';
import { State } from '../entities/state.entity';

@Injectable()
export class StatesRepository extends AbstractRepository<State> {
  constructor(
    @InjectRepository(State)
    private statesRepository: Repository<State>,
    private readonly i18nService: I18nService,
  ) {
    super(statesRepository, i18nService);
  }

  //------------------------------
  async findAllWithFilter(query: FindAllStatesQueryDto) {
    const qb = this.statesRepository.createQueryBuilder('state');

    if (query.processId) {
      qb.where('state.processId = :processId', {
        processId: query.processId,
      });
    }
    qb.orderBy('state.createdAt', 'ASC');

    return qb.getManyAndCount();
  }
}
