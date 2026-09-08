import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { DataSource, Repository } from 'typeorm';
import { AssetCategory } from '../entities/asset-category.entity';
import { AssetType } from '../entities/asset-type.entity';

@Injectable()
export class AssetTypeRepository extends AbstractRepository<AssetType> {
  constructor(
    @InjectRepository(AssetType)
    private assetTypeRepository: Repository<AssetType>,
    @InjectRepository(AssetCategory)
    private readonly assetCategoryRepository: Repository<AssetCategory>,
    private readonly dataSource: DataSource,
    private i18nService: I18nService,
  ) {
    super(assetTypeRepository, i18nService);
  }

  //------------------------------
  async assetTypeRetrievalTransactional(
    assetTypeData: Partial<AssetType>,
    assetCategoryData: Partial<AssetCategory>,
  ): Promise<AssetType> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let assetCategory = await queryRunner.manager.findOne(AssetCategory, {
        where: { id: assetCategoryData.id },
      });

      if (!assetCategory) {
        assetCategory = queryRunner.manager.create(
          AssetCategory,
          assetCategoryData,
        );
        await queryRunner.manager.save(assetCategory);
      }

      let assetType = await queryRunner.manager.findOne(AssetType, {
        where: { id: assetTypeData.id },
        withDeleted: true,
      });
      if (!assetType) {
        assetType = queryRunner.manager.create(AssetType, {
          ...assetTypeData,
          assetCategory,
        });
        await queryRunner.manager.save(assetType);
      } else if (assetType.deletedAt) {
        await queryRunner.manager.update(
          AssetType,
          { id: assetTypeData.id },
          {
            ...assetTypeData,
            assetCategory,
            deletedAt: null,
          },
        );
      }

      await queryRunner.commitTransaction();

      return assetType;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log('Transaction failed:', error);

      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
