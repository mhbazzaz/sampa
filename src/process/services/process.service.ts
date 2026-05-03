import { Injectable } from '@nestjs/common';
import { DeepPartial, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { Process } from '../entities/process.entity';
import { ProcessRepository } from '../repositories/process.repository';

@Injectable()
export class ProcessService {
  constructor(private readonly permissionGroupRepository: ProcessRepository) {}

  //------------------------------
  async create(data: DeepPartial<Process>): Promise<Process> {
    return this.permissionGroupRepository.save(data);
  }

  //------------------------------
  async findOne(data: FindOneOptions<Process>): Promise<Process | null> {
    return this.permissionGroupRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.permissionGroupRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<Process>,
    updateProcess: Partial<Process>,
  ) {
    return this.permissionGroupRepository.update(data, updateProcess);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<Process>) {
    return this.permissionGroupRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.permissionGroupRepository.findAllPagination(skip, take, {
      order: { name: 'DESC' },
    });
  }
}
