import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { LocationType } from '../entities/location-type.entity';

@Injectable()
export class LocationTypeRepository extends AbstractRepository<LocationType> {
  constructor(
    @InjectRepository(LocationType)
    private locationTypeRepository: Repository<LocationType>,
    private readonly i18nService: I18nService,
  ) {
    super(locationTypeRepository, i18nService);
  }

  //------------------------------
  async findAllUserScope(query: {
    skip: number;
    take: number;
    assetTypeVersionIds?: string[];
    name?: string;
    shouldBeRelatedToAssetTypeVersionId?: string;
  }) {
    const qb = this.locationTypeRepository
      .createQueryBuilder('locationType')
      .leftJoin('locationType.assetTypeVersions', 'assetTypeVersion');

    if (query.assetTypeVersionIds?.length) {
      qb.andWhere('assetTypeVersion.id IN (:...versionIds)', {
        versionIds: query.assetTypeVersionIds,
      });
    }

    if (query.name) {
      qb.andWhere('locationType.name ILIKE :name', {
        name: `%${query.name}%`,
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

    qb.orderBy('locationType.createdAt', 'DESC');
    qb.skip(query.skip);
    qb.take(query.take);

    return qb.getManyAndCount();
  }
}
