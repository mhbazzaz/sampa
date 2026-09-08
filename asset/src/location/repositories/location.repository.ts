import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { FindManyOptions, Repository } from 'typeorm';
import { FindAllLocationQueryDto } from '../dto/input/find-all-location-query.dto';
import { FindAllLocationUserQueryDto } from '../dto/input/find-all-location-user-query.dto';
import { Location } from '../entities/location.entity';

@Injectable()
export class LocationRepository extends AbstractRepository<Location> {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    private readonly i18nService: I18nService,
  ) {
    super(locationRepository, i18nService);
  }

  //------------------------------
  async findAllPaginateAdminScope(query: FindAllLocationQueryDto) {
    const qb = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.locationType', 'locationType')
      .leftJoinAndSelect('location.tags', 'tags')
      .orderBy('location.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.take);

    if (query.name) {
      qb.andWhere('location.name ILIKE :name', { name: `%${query.name}%` });
    }

    if (query.parentId) {
      qb.andWhere('location.parentId = :parentId', {
        parentId: query.parentId,
      });
    }

    if (query.exCode) {
      qb.andWhere('location.exCode ILIKE :exCode', {
        exCode: `%${query.exCode}%`,
      });
    }

    if (query.code) {
      qb.andWhere('location.code ILIKE :code', { code: `%${query.code}%` });
    }

    if (query.tagIds?.length) {
      qb.andWhere('tags.id IN (:...tagIds)', { tagIds: query.tagIds });
    }

    if (query.locationTypeId) {
      qb.andWhere('location.locationTypeId = :locationTypeId', {
        locationTypeId: query.locationTypeId,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return { items, total };
  }

  //------------------------------
  async findAllPaginateUserScope(query: FindAllLocationUserQueryDto) {
    const qb = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.locationType', 'locationType')
      .leftJoin('locationType.assetTypeVersions', 'assetTypeVersion')
      .leftJoinAndSelect('location.tags', 'tags')
      .orderBy('location.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.take);

    if (query.name) {
      qb.andWhere('location.name ILIKE :name', { name: `%${query.name}%` });
    }

    if (query.parentId) {
      qb.andWhere('location.parentId = :parentId', {
        parentId: query.parentId,
      });
    }

    if (query.exCode) {
      qb.andWhere('location.exCode ILIKE :exCode', {
        exCode: `%${query.exCode}%`,
      });
    }

    if (query.code) {
      qb.andWhere('location.code ILIKE :code', { code: `%${query.code}%` });
    }

    if (query.tagIds?.length) {
      qb.andWhere('tags.id IN (:...tagIds)', { tagIds: query.tagIds });
    }

    if (query.locationTypeIds?.length) {
      qb.andWhere('location.locationTypeId IN (:...locationTypeIds)', {
        locationTypeIds: query.locationTypeIds,
      });
    }

    if (query.shouldBeRelatedToAssetTypeVersionId) {
      qb.leftJoinAndSelect('assetTypeVersion.parents', 'parents');
      qb.leftJoinAndSelect('assetTypeVersion.children', 'child');

      qb.andWhere(
        '(parents.parentId = :id OR parents.childId = :id OR child.parentId = :id OR child.childId = :id)',
        {
          id: query.shouldBeRelatedToAssetTypeVersionId,
        },
      );
    }

    const [items, total] = await qb.getManyAndCount();

    return { items, total };
  }

  //------------------------------
  async findOneCaseInsensitive(
    column: keyof Location,
    value: string,
  ): Promise<Location | null> {
    const lowerValue = value.toLowerCase();
    return this.locationRepository
      .createQueryBuilder('location')
      .where(`LOWER(location.${column}) = :value`, { value: lowerValue })
      .getOne();
  }

  //------------------------------
  async count(options?: FindManyOptions<Location>) {
    return this.locationRepository.count(options);
  }
}
