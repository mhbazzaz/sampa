import { Injectable } from '@nestjs/common';
import { DeepPartial, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { Action } from '../entities/action.entity';
import { ActionRepository } from '../repositories/action.repository';

@Injectable()
export class ActionService {
  constructor(private readonly actionRepository: ActionRepository) {}

  //------------------------------
  async create(data: DeepPartial<Action>): Promise<Action> {
    return this.actionRepository.save(data);
  }

  //------------------------------
  async findOne(data: FindOneOptions<Action>): Promise<Action | null> {
    return this.actionRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.actionRepository.findAll();
  }

  //------------------------------
  async update(data: FindOptionsWhere<Action>, updateAction: Partial<Action>) {
    return this.actionRepository.update(data, updateAction);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<Action>) {
    return this.actionRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.actionRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }
}
