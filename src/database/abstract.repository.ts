import { NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';

export abstract class AbstractRepository<T extends ObjectLiteral> {
  constructor(
    private readonly entityRepository: Repository<T>,
    private readonly i18n: I18nService,
  ) {}

  //------------------------------
  async save(entity: DeepPartial<T>): Promise<T> {
    return this.entityRepository.save(entity);
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<T>,
    updateUserDto: Partial<T>,
  ): Promise<T> {
    let record = await this.findOne({ where: data });
    if (!record)
      throw new NotFoundException(
        this.i18n.t('messages.ERROR_NOT_FOUND_RECORD'),
      );

    record = { ...record, ...updateUserDto };
    return this.save(record);
  }

  //------------------------------
  async findOne(data: FindOneOptions<T>): Promise<T | null> {
    return this.entityRepository.findOne(data);
  }

  //------------------------------
  async findOneBy(data: FindOptionsWhere<T>): Promise<T | null> {
    return this.entityRepository.findOneBy(data);
  }

  //------------------------------
  async find(where: FindOptionsWhere<T>): Promise<T[]> {
    return this.entityRepository.findBy(where);
  }

  //------------------------------
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.entityRepository.find(options);
  }

  //------------------------------
  async findAndDelete(where: FindOptionsWhere<T>) {
    return this.entityRepository.softDelete(where);
  }

  //------------------------------
  async count(options?: FindManyOptions<T> | undefined) {
    return this.entityRepository.count(options);
  }

  //------------------------------
  async findAllPagination(
    skip: number,
    take: number,
    {
      where,
      relations,
      order,
      withDeleted,
    }: {
      where?: FindOptionsWhere<T> | FindOptionsWhere<T>[] | undefined;
      relations?: FindOptionsRelations<T>;
      order: FindOptionsOrder<T>;
      withDeleted?: boolean;
    },
  ): Promise<[T[], number]> {
    return this.entityRepository.findAndCount({
      where,
      skip,
      take,
      relations,
      order,
      withDeleted: withDeleted,
    });
  }

  //------------------------------
  async findAllFiltered({
    where,
    relations,
    order,
  }: {
    where?: FindOptionsWhere<T>;
    relations?: FindOptionsRelations<T>;
    order: FindOptionsOrder<T>;
  }): Promise<T[]> {
    return this.entityRepository.find({
      where,
      relations,
      order,
    });
  }
}
