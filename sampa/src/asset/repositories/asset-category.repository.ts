import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { AssetCategory } from '../entities/asset-category.entity';

@Injectable()
export class AssetCategoryRepository extends AbstractRepository<AssetCategory> {
  constructor(
    @InjectRepository(AssetCategory)
    private assetCategoryRepository: Repository<AssetCategory>,
    private i18nService: I18nService,
  ) {
    super(assetCategoryRepository, i18nService);
  }

  async findAllScopeInternal() {
    return this.assetCategoryRepository
      .createQueryBuilder('assetCategory')
      .innerJoinAndSelect('assetCategory.assetTypes', 'assetTypes')
      .execute();
  }
}
