import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AssetCategory } from 'src/asset-category/entities/asset-category.entity';
import { AssetTypeSortFields } from 'src/common/enums/asset-type-sort.enum';
import { AbstractRepository } from 'src/database/abstract.repository';
import { User } from 'src/users/entities/user.entity';
import { In, Repository } from 'typeorm';
import { FindAllAssetTypeQueryUserScopeDto } from '../dto/input/find-all-asset-type-query-user-scope.dto';
import { FindAllAssetTypeQueryDto } from '../dto/input/find-all-asset-type-query.dto';
import { AssetTypeRelation } from '../entities/asset-type-relation.entity';
import { AssetTypeVersion } from '../entities/asset-type-version.entity';
import { AssetType } from '../entities/asset-type.entity';

@Injectable()
export class AssetTypeRepository extends AbstractRepository<AssetType> {
  constructor(
    @InjectRepository(AssetType)
    private assetTypeRepository: Repository<AssetType>,
    @InjectRepository(AssetTypeVersion)
    private assetTypeVersionRepository: Repository<AssetTypeVersion>,
    @InjectRepository(AssetTypeRelation)
    private assetTypeRelationRepository: Repository<AssetTypeRelation>,
    private readonly i18nService: I18nService,
  ) {
    super(assetTypeRepository, i18nService);
  }

  //------------------------------
  async findAllPaginationAdminScope(
    query: FindAllAssetTypeQueryDto,
  ): Promise<[AssetType[], number]> {
    const {
      name,
      code,
      assetCategoryId,
      version,
      skip = 0,
      take = 10,
      orderBy = AssetTypeSortFields.CREATED_AT,
      orderDirection = 'DESC',
    } = query;

    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100);

    const versionCte = this.assetTypeVersionRepository
      .createQueryBuilder('v')
      .select([
        'v.id as id',
        'v.assetTypeId as assetTypeId',
        'v.version as version',
        `ROW_NUMBER() OVER (PARTITION BY v.assetTypeId ORDER BY v.version DESC) as row_num`,
      ])
      .where('v.archived = false')
      .andWhere('v.deletedAt IS NULL');

    if (version !== undefined) {
      versionCte.andWhere('v.version = :version', { version });
    }

    const versionSubQuery = this.assetTypeVersionRepository.manager
      .createQueryBuilder()
      .select([
        'sub.id as id',
        'sub.assetTypeId as assetTypeId',
        'sub.version as version',
      ])
      .from(`(${versionCte.getQuery()})`, 'sub')
      .where(version !== undefined ? '1=1' : 'sub.row_num = 1')
      .setParameters(versionCte.getParameters());

    const versions = await versionSubQuery.getRawMany();
    const versionIds = versions.map((v) => v.id);

    if (versionIds.length === 0) {
      return [[], 0];
    }

    const qb = this.assetTypeRepository
      .createQueryBuilder('at')
      .leftJoinAndSelect('at.assetCategory', 'ac')
      .innerJoinAndMapMany(
        'at.assetTypeVersions',
        'at.assetTypeVersions',
        'av',
        'av.id IN (:...versionIds)',
        { versionIds },
      )
      .leftJoinAndSelect('av.parents', 'av_parents')
      .leftJoinAndSelect('av.children', 'av_children')
      .leftJoinAndSelect('av.locationTypes', 'av_locationTypes')
      .where('at.deletedAt IS NULL')
      .andWhere('ac.deletedAt IS NULL');

    if (name) {
      qb.andWhere('at.name ILIKE :name', { name: `%${name}%` });
    }

    if (code) {
      qb.andWhere('at.code ILIKE :code', { code: `%${code}%` });
    }

    if (assetCategoryId) {
      qb.andWhere('at.assetCategoryId = :assetCategoryId', { assetCategoryId });
    }

    const validSortFields = Object.values(AssetTypeSortFields);
    const sortField = validSortFields.includes(orderBy)
      ? orderBy
      : AssetTypeSortFields.CREATED_AT;

    if (sortField === AssetTypeSortFields.CATEGORY_NAME) {
      qb.orderBy('ac.name', orderDirection);
    } else {
      qb.orderBy(`at.${sortField}`, orderDirection);
    }

    return qb.skip(validatedSkip).take(validatedTake).getManyAndCount();
  }

  //------------------------------
  async findAllPaginationUserScope(
    query: FindAllAssetTypeQueryUserScopeDto,
  ): Promise<[AssetType[], number]> {
    const {
      name,
      code,
      assetCategoryId,
      assetTypeId,
      assetTypeVersionId,
      version,
      skip = 0,
      take = 10,
      orderBy = AssetTypeSortFields.CREATED_AT,
      orderDirection = 'DESC',
    } = query;

    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100);

    const versionCte = this.assetTypeVersionRepository
      .createQueryBuilder('v')
      .select([
        'v.id as id',
        'v.assetTypeId as assetTypeId',
        'v.version as version',
        `ROW_NUMBER() OVER (PARTITION BY v.assetTypeId ORDER BY v.version DESC) as row_num`,
      ])
      .where('v.archived = false')
      .andWhere('v.deletedAt IS NULL');

    if (version !== undefined) {
      versionCte.andWhere('v.version = :version', { version });
    }

    const versionSubQuery = this.assetTypeVersionRepository.manager
      .createQueryBuilder()
      .select([
        'sub.id as id',
        'sub.assetTypeId as assetTypeId',
        'sub.version as version',
      ])
      .from(`(${versionCte.getQuery()})`, 'sub')
      .where(version !== undefined ? '1=1' : 'sub.row_num = 1')
      .setParameters(versionCte.getParameters());

    let relatedAssetTypeIds: string[] | undefined;
    if (assetTypeVersionId) {
      const relations = await this.assetTypeRelationRepository
        .createQueryBuilder('relation')
        .leftJoinAndSelect('relation.parent', 'parentVersion')
        .leftJoinAndSelect('relation.child', 'childVersion')
        .andWhere('(parentVersion.id = :id OR childVersion.id = :id)', {
          id: assetTypeVersionId,
        })
        .getMany();

      const ids = new Set<string>([]);
      relations.forEach((relation) => {
        if (
          relation.parent?.assetTypeId &&
          relation.parent?.assetTypeId !== assetTypeId
        ) {
          ids.add(relation.parent.assetTypeId);
        }
        if (
          relation.child?.assetTypeId &&
          relation.child?.assetTypeId !== assetTypeId
        ) {
          ids.add(relation.child.assetTypeId);
        }
      });

      relatedAssetTypeIds = Array.from(ids);

      if (relatedAssetTypeIds.length === 0) {
        return [[], 0];
      }
    }

    const versions = await versionSubQuery.getRawMany();
    const versionIds = versions.map((v) => v.id);

    if (versionIds.length === 0) {
      return [[], 0];
    }

    const qb = this.assetTypeRepository
      .createQueryBuilder('at')
      .leftJoinAndSelect('at.assetCategory', 'ac')
      .innerJoinAndMapMany(
        'at.assetTypeVersions',
        'at.assetTypeVersions',
        'av',
        'av.id IN (:...versionIds)',
        { versionIds },
      )
      .leftJoinAndSelect('av.parents', 'av_parents')
      .leftJoinAndSelect('av.children', 'av_children')
      .leftJoinAndSelect('av.locationTypes', 'av_locationTypes')
      .where('at.deletedAt IS NULL')
      .andWhere('ac.deletedAt IS NULL');

    if (name) {
      qb.andWhere('at.name ILIKE :name', { name: `%${name}%` });
    }

    if (code) {
      qb.andWhere('at.code ILIKE :code', { code: `%${code}%` });
    }

    if (assetCategoryId) {
      qb.andWhere('at.assetCategoryId = :assetCategoryId', { assetCategoryId });
    }

    if (relatedAssetTypeIds) {
      qb.andWhere('at.id IN (:...relatedAssetTypeIds)', {
        relatedAssetTypeIds,
      });
    }

    const validSortFields = Object.values(AssetTypeSortFields);
    const sortField = validSortFields.includes(orderBy)
      ? orderBy
      : AssetTypeSortFields.CREATED_AT;

    if (sortField === AssetTypeSortFields.CATEGORY_NAME) {
      qb.orderBy('ac.name', orderDirection);
    } else {
      qb.orderBy(`at.${sortField}`, orderDirection);
    }

    return qb.skip(validatedSkip).take(validatedTake).getManyAndCount();
  }

  //------------------------------
  async findRelatedAssetTypes(assetTypeVersionId: string) {
    const relations = await this.assetTypeRelationRepository
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.parent', 'parentVersion')
      .leftJoinAndSelect('relation.child', 'childVersion')
      .where('relation.parentId = :id OR relation.childId = :id', {
        id: assetTypeVersionId,
      })
      .orderBy('relation.createdAt', 'DESC')
      .getMany();

    if (!relations.length) {
      return { relatedAssetTypeVersions: [], relatedAssetCategories: [] };
    }

    const relatedVersionIds = new Set<string>();
    relations.forEach((relation) => {
      if (relation.parent?.id && relation.parent.id !== assetTypeVersionId) {
        relatedVersionIds.add(relation.parent.id);
      }
      if (relation.child?.id && relation.child.id !== assetTypeVersionId) {
        relatedVersionIds.add(relation.child.id);
      }
    });

    if (!relatedVersionIds.size) {
      return { relatedAssetTypeVersions: [], relatedAssetCategories: [] };
    }

    const relatedAssetTypeVersions = await this.assetTypeVersionRepository.find(
      {
        where: { id: In([...relatedVersionIds]) },
        relations: {
          assetType: { assetCategory: true },
          parents: { assetRelationType: true },
          children: { assetRelationType: true },
          locationTypes: true,
        },
        order: { createdAt: 'DESC' },
      },
    );

    const relatedAssetCategoriesMap = new Map<string, AssetCategory>();
    relatedAssetTypeVersions.forEach((version) => {
      if (version.assetType?.assetCategory) {
        relatedAssetCategoriesMap.set(
          version.assetType.assetCategory.id,
          version.assetType.assetCategory,
        );
      }
    });

    const relatedAssetCategories = Array.from(
      relatedAssetCategoriesMap.values(),
    );

    return {
      relatedAssetTypeVersions,
      relatedAssetCategories,
    };
  }

  //------------------------------
  async findTypeForSampaUser(
    skip: number,
    take: number,
    name: string,
    categoryId: string,
    user: User,
    assetTypeIds: string[],
  ) {
    const queryBuilder = this.assetTypeRepository
      .createQueryBuilder('assetType')
      .leftJoinAndSelect('assetType.assets', 'assets')
      .leftJoinAndSelect('assets.assetVersions', 'assetVersions')
      .where('assetType.id IN (:...assetTypeIds)', { assetTypeIds });

    if (name) {
      queryBuilder.andWhere('assetType.name ILIKE :name', {
        name: `%${name}%`,
      });
    }

    if (categoryId) {
      queryBuilder.andWhere('assetType.assetCategoryId = :categoryId', {
        categoryId,
      });
    }

    queryBuilder.andWhere(
      '(assetVersions.editorId = :userId OR assetVersions.accountableId = :userId)',
      { userId: user.id },
    );

    queryBuilder.andWhere('assetVersions.archived = :archived', {
      archived: false,
    });

    queryBuilder.orderBy('assetType.createdAt', 'DESC');

    return queryBuilder.skip(skip).take(take).getManyAndCount();
  }
}
