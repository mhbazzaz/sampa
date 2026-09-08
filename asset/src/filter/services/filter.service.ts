import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Filter } from 'src/filter/entities/filter.entity';
import { FindOneOptions, FindOptionsWhere, ILike } from 'typeorm';
import { CreateFilterDto } from '../dto/input/create-filter.dto';
import { FindAllFilterUserScopeQueryDto } from '../dto/input/find-all-filter-user-scope-query.dto';
import { UpdateFilterDto } from '../dto/input/update-filter.dto';
import { FilterValue } from '../entities/filter-value.entity';
import { FilterValueRepository } from '../repositories/filter-value.repository';
import { FilterRepository } from '../repositories/filter.repository';

@Injectable()
export class FilterService {
  constructor(
    private readonly filterRepository: FilterRepository,
    private readonly filterValueRepository: FilterValueRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(data: CreateFilterDto): Promise<Filter> {
    const { key, values } = data;

    const filter = await this.filterRepository.save({
      key,
    });

    const arr: FilterValue[] = [];
    for (let i = 0; i < values.length; i++) {
      const element = values[i];
      const filterValue = new FilterValue({
        filterId: filter.id,
        value: element,
      });
      arr.push(filterValue);
    }

    await this.filterValueRepository.saveMany(arr);

    return filter;
  }

  //------------------------------
  async findOne(data: FindOneOptions<Filter>): Promise<Filter | null> {
    return this.filterRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.filterRepository.findAll();
  }

  //------------------------------
  async update(id: string, updateFilter: UpdateFilterDto) {
    const { key, values, oldValues } = updateFilter;

    const existingFilter = await this.filterRepository.findOne({
      where: { id: id },
      relations: { filterValues: true },
    });

    if (!existingFilter) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_PROPERTY_ID_EXISTS', {
          args: { value: id, property: 'Filter' },
        }),
      );
    }

    const { filterValues, ...filter } = existingFilter;

    if (oldValues) {
      for (let i = 0; i < filterValues!.length; i++) {
        const filterValue = filterValues![i];

        const existingIndex = oldValues.findIndex(
          (oldValue) => oldValue.id === filterValue.id,
        );

        if (existingIndex === -1) {
          await this.filterValueRepository.findAndDelete({
            id: filterValue.id,
          });
        }
      }

      for (let i = 0; i < oldValues.length; i++) {
        const value = oldValues[i];
        const filterValue = await this.filterValueRepository.findOne({
          where: { id: value.id },
        });
        if (!filterValue) {
          continue;
        }
        filterValue.value = value.value;
        await this.filterValueRepository.save(filterValue);
      }
    }

    if (values) {
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        await this.filterValueRepository.save({ value, filterId: filter.id });
      }
    }

    if (key) {
      filter.key = key;
    }
    return this.filterRepository.save(filter);
  }

  //------------------------------
  async remove(id: string) {
    return this.filterRepository.findAndDelete({ id });
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.filterRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async findAllFiltered({
    where,
  }: {
    where: FindOptionsWhere<Filter>;
  }): Promise<Filter[]> {
    return this.filterRepository.findAllFiltered({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async findAllUserScope(query: FindAllFilterUserScopeQueryDto) {
    return this.filterRepository.findAllPagination(query.skip, query.take, {
      where: { key: query.key ? ILike(`%${query.key}%`) : undefined },
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async findOneAdminScope(id: string): Promise<Filter | null> {
    return this.filterRepository.findOne({
      where: { id },
      relations: { filterValues: true },
    });
  }
}
