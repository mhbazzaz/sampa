import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { LocationType } from 'src/location-type/entities/location-type.entity';
import { Repository } from 'typeorm';
import { AssetTypeVersion } from '../entities/asset-type-version.entity';

@Injectable()
export class AssetTypeVersionRepository extends AbstractRepository<AssetTypeVersion> {
  constructor(
    @InjectRepository(AssetTypeVersion)
    private assetTypeVersionRepository: Repository<AssetTypeVersion>,
    private readonly i18nService: I18nService,
  ) {
    super(assetTypeVersionRepository, i18nService);
  }

  //------------------------------
  async updateLocationTypes(
    assetTypeVersionId: string,
    locationTypes: LocationType[],
  ): Promise<void> {
    await this.assetTypeVersionRepository
      .createQueryBuilder()
      .relation(AssetTypeVersion, 'locationTypes')
      .of(assetTypeVersionId)
      .set(locationTypes);
  }

  //------------------------------
  async findOneAssetTypeVersionByIdUserScope(query: {
    skip: number;
    take: number;
    assetTypeId: string;
    version?: number;
    shouldBeRelatedToAssetTypeVersionId?: string;
  }) {
    const qb =
      this.assetTypeVersionRepository.createQueryBuilder('assetTypeVersion');

    qb.where('assetTypeVersion.assetTypeId = :assetTypeId', {
      assetTypeId: query.assetTypeId,
    });

    if (query.version !== undefined) {
      qb.andWhere('assetTypeVersion.version = :version', {
        version: +query.version,
      });
    }

    if (query.shouldBeRelatedToAssetTypeVersionId !== undefined) {
      qb.leftJoinAndSelect('assetTypeVersion.parents', 'parents');
      qb.leftJoinAndSelect('assetTypeVersion.children', 'child');

      qb.andWhere(
        '(parents.parentId = :id OR parents.childId = :id OR child.parentId = :id OR child.childId = :id)',
        {
          id: query.shouldBeRelatedToAssetTypeVersionId,
        },
      );
    }

    qb.orderBy('assetTypeVersion.createdAt', 'DESC');
    qb.skip(query.skip);
    qb.take(query.take);

    return qb.getManyAndCount();
  }
}
