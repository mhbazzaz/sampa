import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { AssetTypeRelation } from '../../asset-type/entities/asset-type-relation.entity';

@Injectable()
export class AssetTypeRelationRepository extends AbstractRepository<AssetTypeRelation> {
  constructor(
    @InjectRepository(AssetTypeRelation)
    private assetTypeRelationRepository: Repository<AssetTypeRelation>,
    private readonly i18nService: I18nService,
  ) {
    super(assetTypeRelationRepository, i18nService);
  }

  //------------------------------
  async getRelatedAssetTypes(assetTypeVersionIds: string[]) {
    return this.assetTypeRelationRepository
      .createQueryBuilder('relation')
      .where('relation.parentId IN (:...ids)', { ids: assetTypeVersionIds })
      .orWhere('relation.childId IN (:...ids)', { ids: assetTypeVersionIds })
      .leftJoinAndSelect('relation.parent', 'parentVersion')
      .leftJoinAndSelect('relation.child', 'childVersion')
      .andWhere('relation.deletedAt IS NULL')
      .andWhere('parentVersion.deletedAt IS NULL')
      .andWhere('childVersion.deletedAt IS NULL')
      .orderBy('relation.createdAt', 'DESC')
      .getMany();
  }
}
