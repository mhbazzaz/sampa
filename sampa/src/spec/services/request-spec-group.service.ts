import { Injectable } from '@nestjs/common';
import { DeepPartial, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { RequestSpecGroup } from '../entities/request-spec-group.entity';
import { RequestSpecGroupRepository } from '../repositories/request-spec-group.repository';

@Injectable()
export class RequestSpecGroupService {
  constructor(
    private readonly RequestSpecGroupRepository: RequestSpecGroupRepository,
  ) {}

  //------------------------------
  async create(data: DeepPartial<RequestSpecGroup>): Promise<RequestSpecGroup> {
    return this.RequestSpecGroupRepository.save(data);
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<RequestSpecGroup>,
  ): Promise<RequestSpecGroup | null> {
    return this.RequestSpecGroupRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.RequestSpecGroupRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<RequestSpecGroup>,
    updateRequestSpecGroup: Partial<RequestSpecGroup>,
  ) {
    return this.RequestSpecGroupRepository.update(data, updateRequestSpecGroup);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<RequestSpecGroup>) {
    return this.RequestSpecGroupRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.RequestSpecGroupRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }
}
