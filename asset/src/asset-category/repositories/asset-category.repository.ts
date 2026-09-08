import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { GetAssetCategoryUserPaginationDto } from '../dto/input/get-asset-category-user-pagination.dto';
import { AssetCategory } from '../entities/asset-category.entity';

@Injectable()
export class AssetCategoryRepository extends AbstractRepository<AssetCategory> {
  constructor(
    @InjectRepository(AssetCategory)
    private assetCategoryRepository: Repository<AssetCategory>,
    private readonly i18nService: I18nService,
  ) {
    super(assetCategoryRepository, i18nService);
  }

  async findCategoryForSampaUser(
    query: GetAssetCategoryUserPaginationDto,
    user: User,
    assetCategoryIds: string[],
  ) {
    const queryBuilder = this.assetCategoryRepository
      .createQueryBuilder('assetCategory')
      .leftJoinAndSelect('assetCategory.assetTypes', 'assetTypes')
      .leftJoinAndSelect('assetTypes.assets', 'assets')
      .leftJoinAndSelect('assets.assetVersions', 'assetVersions')
      .where('assetCategory.id IN (:...assetCategoryIds)', {
        assetCategoryIds,
      });

    if (query.name) {
      queryBuilder.andWhere('assetCategory.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    queryBuilder.andWhere(
      '(assetVersions.editorId = :userId OR assetVersions.accountableId = :userId)',
      { userId: user.id },
    );

    queryBuilder.andWhere('assetVersions.archived = :archived', {
      archived: false,
    });

    queryBuilder.orderBy('assetCategory.createdAt', 'DESC');

    const [items, total] = await queryBuilder
      .skip(query.skip)
      .take(query.take)
      .getManyAndCount();

    return [
      items,
      total,
      // Add any other pagination metadata your findAllPagination method returns
    ];
  }
}
