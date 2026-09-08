import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import {
  DataSource,
  DeepPartial,
  FindManyOptions,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { FindAllAssetQueryDto } from '../dto/input/find-all-asset-query.dto';
import { FindAllAssetQueryWithOutPaginateDto } from '../dto/input/find-all-asset-without-paginate.dto';
import { GetFilteredAssetVersions } from '../dto/input/get-filtered-asset-versions.dto';
import { AssetRelation } from '../entities/asset-relation.entity';
import { AssetVersion } from '../entities/asset-version.entity';

@Injectable()
export class AssetVersionRepository extends AbstractRepository<AssetVersion> {
  constructor(
    @InjectRepository(AssetVersion)
    private assetVersionRepository: Repository<AssetVersion>,
    @InjectRepository(AssetRelation)
    private assetRelationRepository: Repository<AssetRelation>,
    private dataSource: DataSource,
    private readonly i18nService: I18nService,
  ) {
    super(assetVersionRepository, i18nService);
  }

  //------------------------------
  async getLastRecord(): Promise<AssetVersion | null> {
    return this.assetVersionRepository
      .createQueryBuilder('assetVersion')
      .orderBy('assetVersion.createdAt', 'DESC')
      .getOne();
  }

  //------------------------------
  async findAllPaginationWithFilter(
    decodedFilters: string[] | undefined,
    decodedTags: string[] | undefined,
    query: FindAllAssetQueryDto,
    ids?: string[],
    lastCreatedAt?: string,
  ): Promise<[AssetVersion[], number]> {
    const builder = await this.findAllPaginationWithFilterQueryBuilder(
      decodedFilters,
      decodedTags,
      query,
      ids,
      false,
      lastCreatedAt,
    );
    if (!builder) {
      return [[], 0];
    } else {
      return builder.getManyAndCount();
    }
  }

  //------------------------------
  async findAllPaginationWithFilterForReport(
    decodedFilters: string[] | undefined,
    decodedTags: string[] | undefined,
    query: FindAllAssetQueryDto,
    ids?: string[],
    lastCreatedAt?: string,
  ): Promise<[AssetVersion[], number]> {
    const builder = await this.findAllPaginationWithFilterQueryBuilder(
      decodedFilters,
      decodedTags,
      query,
      ids,
      true,
      lastCreatedAt,
    );
    if (!builder) {
      return [[], 0];
    } else {
      return builder.getManyAndCount();
    }
  }

  //------------------------------
  async findAllWithFilterForDashboard(
    query: GetFilteredAssetVersions,
  ): Promise<number> {
    const builder = await this.findAllWithFilterQueryBuilderForDashboard(query);
    if (!builder) {
      return 0;
    } else {
      return builder.getCount();
    }
  }

  //------------------------------
  async findGroupedByAssetTypeForDashboard(
    query: GetFilteredAssetVersions,
  ): Promise<{ assetTypeId: string; assetTypeName: string; count: number }[]> {
    const qb = await this.findAllWithFilterQueryBuilderForDashboard(query);

    if (!qb) {
      return [];
    }

    qb.select('"assetType"."id"', 'assetTypeId')
      .addSelect('"assetType"."name"', 'assetType')
      .addSelect('COUNT("assetVersion"."id")', 'count')
      .groupBy('"assetType"."id"')
      .addGroupBy('"assetType"."name"');

    const rawResult = await qb.getRawMany();

    return rawResult.map((row) => ({
      assetTypeId: row.assetTypeId,
      assetTypeName: row.assetType,
      count: Number(row.count),
    }));
  }

  //------------------------------
  async findAllPaginationWithFilterQueryBuilder(
    decodedFilters: string[] | undefined,
    decodedTags: string[] | undefined,
    query: FindAllAssetQueryDto,
    ids?: string[],
    shouldFindRelated?: boolean,
    lastCreatedAt?: string,
  ): Promise<SelectQueryBuilder<AssetVersion> | null> {
    const qb = this.assetVersionRepository.createQueryBuilder('assetVersion');

    qb.leftJoinAndSelect('assetVersion.assetTypeVersion', 'assetTypeVersion');
    qb.leftJoinAndSelect('assetVersion.asset', 'asset');
    qb.leftJoinAndSelect('assetTypeVersion.assetType', 'assetType');
    qb.leftJoinAndSelect('assetType.assetCategory', 'assetCategory');

    qb.leftJoinAndSelect('assetVersion.location', 'location');
    qb.leftJoinAndSelect('location.locationType', 'locationType');

    if (shouldFindRelated) {
      qb.leftJoinAndSelect('assetVersion.parents', 'parents');
      qb.leftJoinAndSelect('assetVersion.children', 'children');

      qb.leftJoinAndSelect('parents.parent', 'parentsParent');
      qb.leftJoinAndSelect('parentsParent.asset', 'parentsParentAsset');
      qb.leftJoinAndSelect(
        'parentsParentAsset.assetType',
        'parentsParentAssetAssetType',
      );

      qb.leftJoinAndSelect('parents.child', 'parentsChild');
      qb.leftJoinAndSelect('parentsChild.asset', 'parentsChildAsset');
      qb.leftJoinAndSelect(
        'parentsChildAsset.assetType',
        'parentsChildAssetAssetType',
      );

      qb.leftJoinAndSelect('children.parent', 'childrenParent');
      qb.leftJoinAndSelect('childrenParent.asset', 'childrenParentAsset');
      qb.leftJoinAndSelect(
        'childrenParentAsset.assetType',
        'childrenParentAssetAssetType',
      );

      qb.leftJoinAndSelect('children.child', 'childrenChild');
      qb.leftJoinAndSelect('childrenChild.asset', 'childrenChildAsset');
      qb.leftJoinAndSelect(
        'childrenChildAsset.assetType',
        'childrenChildAssetAssetType',
      );
    }

    qb.where('assetVersion.archived = false');

    if (query.shouldBeRelatedToAssetTypeVersionId) {
      qb.leftJoinAndSelect('assetTypeVersion.parents', 'parents');
      qb.leftJoinAndSelect('assetTypeVersion.children', 'child');

      qb.andWhere(
        '(parents.parentId = :id OR parents.childId = :id OR child.parentId = :id OR child.childId = :id) AND assetVersion.assetTypeVersionId <> :id',
        {
          id: query.shouldBeRelatedToAssetTypeVersionId,
        },
      );
    }

    if (query.supervisorEmployeeIds && query.supervisorEmployeeIds.length > 0) {
      qb.andWhere(
        `(
      "assetType"."isShareable" = true 
      OR "assetVersion"."accountableId" IN (:...accountableIds)
      OR "assetVersion"."editorId" IN (:...editorIds)
    )`,
        {
          accountableIds: query.supervisorEmployeeIds,
          editorIds: query.supervisorEmployeeIds,
        },
      );
    } else if (query.assetUserScopeIds && query.assetUserScopeIds.length > 0) {
      qb.andWhere(
        `(
      "assetType"."isShareable" = true 
      OR "assetVersion"."accountableId" IN (:...assetUserScopeIds)
      OR "assetVersion"."editorId" IN (:...assetUserScopeIds)
    )`,
        {
          assetUserScopeIds: query.assetUserScopeIds,
        },
      );
    } else if (query.userScopeId) {
      qb.andWhere(
        `(
      "assetType"."isShareable" = true 
      OR "assetVersion"."accountableId" = :userId
      OR "assetVersion"."editorId" = :userId
    )`,
        {
          userId: query.userScopeId,
        },
      );
    }

    if (query.locationId) {
      qb.andWhere('location.id = :locationId', {
        locationId: query.locationId,
      });
    }

    if (query.editorId) {
      qb.andWhere('assetVersion.editorId = :editorId', {
        editorId: query.editorId,
      });
    }

    if (query.accountableId) {
      qb.andWhere('assetVersion.accountableId = :accountableId', {
        accountableId: query.accountableId,
      });
    }

    if (query.locationTypeId) {
      qb.andWhere('locationType.id = :locationTypeId', {
        locationTypeId: query.locationTypeId,
      });
    }

    if (query.assetTypeId) {
      qb.andWhere('asset.assetTypeId = :assetTypeId', {
        assetTypeId: query.assetTypeId,
      });
    }

    if (query.assetTypeVersionId) {
      qb.andWhere('assetVersion.assetTypeVersionId = :assetTypeVersionId', {
        assetTypeVersionId: query.assetTypeVersionId,
      });
    }

    if (query.assetCategoryId) {
      qb.andWhere('assetCategory.id = :assetCategoryId', {
        assetCategoryId: query.assetCategoryId,
      });
    }

    if (query.name) {
      qb.andWhere('asset.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.externalRefId) {
      qb.andWhere('asset.externalRefId ILIKE :externalRefId', {
        externalRefId: `%${query.externalRefId}%`,
      });
    }

    if (lastCreatedAt) {
      qb.andWhere('assetVersion.createdAt < :createdAt', {
        createdAt: new Date(lastCreatedAt).toISOString(),
      });
    }

    if (decodedFilters) {
      qb.innerJoinAndSelect('assetVersion.filterValues', 'filterValue');

      let hasFilter = false;
      const filters: string[] = [];
      for (let i = 0; i < decodedFilters.length; i++) {
        const decodedFilter = decodedFilters[i];
        if (!decodedFilter) {
          continue;
        }
        hasFilter = true;
        filters.push(
          (
            await this.dataSource.query(
              `SELECT "assetVersionId" FROM "filter_value_assetVersion" where "filterValueId" = ANY($1)`,
              [decodedFilter.split(',')],
            )
          )?.map((data: { assetVersionId: string }) => data.assetVersionId),
        );
      }

      if (hasFilter) {
        const sharedValues = ids
          ? [...new Set(...filters), ...ids]
          : [...new Set(...filters)];

        if (sharedValues.length === 0) {
          return null;
        }
        qb.andWhere(`assetVersion.id IN (:...ids)`, {
          ids: sharedValues,
        });
      } else if (ids) {
        if (ids.length === 0) {
          return null;
        }
        qb.andWhere(`assetVersion.id IN (:...ids)`, {
          ids: ids,
        });
      }
    } else {
      if (ids) {
        if (ids.length === 0) {
          return null;
        }
        qb.andWhere(`assetVersion.id IN (:...ids)`, {
          ids: ids,
        });
      }
      qb.leftJoinAndSelect('assetVersion.filterValues', 'filterValue');
    }

    if (decodedTags && decodedTags.length > 0) {
      let tagAsset = await this.dataSource.query(
        `SELECT "assetId" FROM "tag_assets_asset" where "tagId" = ANY($1)`,
        [decodedTags],
      );

      if (tagAsset && tagAsset.length > 0) {
        tagAsset = tagAsset.map(
          (tagAssetVersion: any) => tagAssetVersion.assetId,
        );

        qb.innerJoinAndSelect('asset.tags', 'tag');

        const sharedValues = [...new Set(tagAsset)];

        if (sharedValues.length === 0) {
          return null;
        }
        qb.andWhere(`asset.id IN (:...ids)`, {
          ids: sharedValues,
        });
      }
    }

    qb.orderBy('assetVersion.createdAt', 'DESC');
    qb.skip(query.skip);
    qb.take(query.take);

    return qb;
  }

  //------------------------------
  async findAllWithFilterQueryBuilderForDashboard(
    query: GetFilteredAssetVersions,
  ): Promise<SelectQueryBuilder<AssetVersion> | null> {
    const qb = this.assetVersionRepository
      .createQueryBuilder('assetVersion')
      .leftJoin('assetVersion.assetTypeVersion', 'assetTypeVersion')
      .leftJoin('assetTypeVersion.assetType', 'assetType');

    qb.where('assetVersion.archived = false');

    if (query.supervisorEmployeeIds && query.supervisorEmployeeIds.length > 0) {
      qb.andWhere(
        `(
        "assetType"."isShareable" = true
        OR "assetVersion"."accountableId" IN (:...accountableIds)
        OR "assetVersion"."editorId" IN (:...editorIds)
      )`,
        {
          accountableIds: query.supervisorEmployeeIds,
          editorIds: query.supervisorEmployeeIds,
        },
      );
    } else if (query.assetUserScopeIds && query.assetUserScopeIds.length > 0) {
      qb.andWhere(
        `(
        "assetType"."isShareable" = true
        OR "assetVersion"."accountableId" IN (:...assetUserScopeIds)
        OR "assetVersion"."editorId" IN (:...assetUserScopeIds)
      )`,
        {
          assetUserScopeIds: query.assetUserScopeIds,
        },
      );
    } else if (query.userScopeId) {
      qb.andWhere(
        `(
        "assetType"."isShareable" = true
        OR "assetVersion"."accountableId" = :userId
        OR "assetVersion"."editorId" = :userId
      )`,
        {
          userId: query.userScopeId,
        },
      );
    }

    return qb;
  }

  //------------------------------
  async findGroupedByResponsibilityForDashboard(
    query: GetFilteredAssetVersions,
    userId: string,
  ): Promise<{
    accountableCount: number;
    responsibleCount: number;
    restOfAccessible: number;
  }> {
    const qb = await this.findAllWithFilterQueryBuilderForDashboard(query);

    if (!qb) {
      return {
        accountableCount: 0,
        responsibleCount: 0,
        restOfAccessible: 0,
      };
    }

    qb.select([
      `
    COUNT(
      CASE
        WHEN "assetVersion"."accountableId" = :userId
        THEN 1
      END
    ) AS "accountableCount"
    `,
      `
    COUNT(
      CASE
        WHEN "assetVersion"."editorId" = :userId
         AND "assetVersion"."accountableId" != :userId
        THEN 1
      END
    ) AS "responsibleCount"
    `,
      `
    COUNT(
      CASE
        WHEN "assetVersion"."accountableId" != :userId
         AND "assetVersion"."editorId" != :userId
        THEN 1
      END
    ) AS "restOfAccessible"
    `,
    ]).setParameter('userId', userId);

    const raw = await qb.getRawOne();

    return {
      accountableCount: Number(raw.accountableCount),
      responsibleCount: Number(raw.responsibleCount),
      restOfAccessible: Number(raw.restOfAccessible),
    };
  }

  //------------------------------
  async findAllPaginationWithOutFilter(
    decodedFilters: string[] | undefined,
    decodedTags: string[] | undefined,
    query: FindAllAssetQueryWithOutPaginateDto,
  ): Promise<[AssetVersion[], number]> {
    const qb = this.assetVersionRepository.createQueryBuilder('assetVersion');

    qb.leftJoinAndSelect('assetVersion.assetTypeVersion', 'assetTypeVersion');
    qb.leftJoinAndSelect('assetTypeVersion.assetType', 'assetType');
    qb.leftJoinAndSelect('assetType.assetCategory', 'assetCategory');

    qb.where('assetVersion.archived = false');

    if (query.assetTypeVersionId) {
      qb.andWhere('assetVersion.assetTypeVersionId = :assetTypeVersionId', {
        assetTypeVersionId: query.assetTypeVersionId,
      });
    }

    if (query.assetCategoryId) {
      qb.andWhere('assetCategory.id = :assetCategoryId', {
        assetCategoryId: query.assetCategoryId,
      });
    }

    if (query.name) {
      qb.andWhere('assetVersion.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.externalRefId) {
      qb.andWhere('assetVersion.externalRefId = :externalRefId', {
        externalRefId: query.externalRefId,
      });
    }

    if (decodedFilters) {
      qb.innerJoinAndSelect('assetVersion.filterValues', 'filterValue');

      let hasFilter = false;
      const filters: string[] = [];
      for (let i = 0; i < decodedFilters.length; i++) {
        const decodedFilter = decodedFilters[i];
        if (!decodedFilter) {
          continue;
        }
        hasFilter = true;
        filters.push(
          (
            await this.dataSource.query(
              `SELECT "assetVersionId" FROM "filter_value_assetVersion" where "filterValueId" = ANY($1)`,
              [decodedFilter.split(',')],
            )
          )?.map((data: { assetVersionId: string }) => data.assetVersionId),
        );
      }

      if (hasFilter) {
        const sharedValues = [...new Set(...filters)];

        if (sharedValues.length === 0) {
          return [[], 0];
        }
        qb.andWhere(`assetVersion.id IN (:...ids)`, {
          ids: sharedValues,
        });
      }
    } else {
      qb.leftJoinAndSelect('assetVersion.filterValues', 'filterValue');
    }

    if (decodedTags) {
      let tagAssetVersions = await this.dataSource.query(
        `SELECT "assetVersionId" FROM "tag_assets_asset" where "tagId" = ANY($1)`,
        [decodedTags],
      );

      if (tagAssetVersions && tagAssetVersions.length > 0) {
        tagAssetVersions = tagAssetVersions.map(
          (tagAssetVersion: any) => tagAssetVersion.assetVersionId,
        );

        qb.innerJoinAndSelect('assetVersion.tags', 'tag');

        const sharedValues = [...new Set(tagAssetVersions)];

        if (sharedValues.length === 0) {
          return [[], 0];
        }
        qb.andWhere(`assetVersion.id IN (:...ids)`, {
          ids: sharedValues,
        });
      }
    }

    qb.orderBy('assetVersion.createdAt', 'DESC');

    return qb.getManyAndCount();
  }

  //------------------------------
  // async createAssetVersion(
  //   createAssetVersionDto: any,
  //   assetVersionRelationTypeId: string | undefined,
  //   existingRelationType: DeepPartial<AssetVersionRelationType>,
  // ): Promise<AssetVersion> {
  //   const queryRunner = this.dataSource.createQueryRunner();

  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const createdAssetVersion = queryRunner.manager.save(
  //       AssetVersion,
  //       new AssetVersion(createAssetVersionDto),
  //     );

  //     const savedAssetVersion = await queryRunner.manager.save(createdAssetVersion);

  //     if (!savedAssetVersion) {
  //       throw new InternalServerErrorException('Failed to save assetVersion');
  //     }

  //     if (createAssetVersionDto.children) {
  //       for (const child of createAssetVersionDto?.children) {
  //         const assetVersionRelation = queryRunner.manager.save(AssetVersionRelation, {
  //           assetVersionRelationTypeId,
  //           assetVersionRelationType: existingRelationType,
  //           parent: savedAssetVersion,
  //           child,
  //         });

  //         await queryRunner.manager.save(assetVersionRelation);
  //       }
  //     }

  //     await queryRunner.commitTransaction();
  //     return savedAssetVersion;
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw new InternalServerErrorException(
  //       `Transaction failed: ${error.message}`,
  //     );
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  //------------------------------
  async getLastWeekAssetVersions(query: GetFilteredAssetVersions) {
    const applyAccessFilters = (qb: any) => {
      if (query.supervisorEmployeeIds?.length) {
        qb.andWhere(
          `(av."accountableId" IN (:...ids) OR av."editorId" IN (:...ids))`,
          { ids: query.supervisorEmployeeIds },
        );
      } else if (query.assetUserScopeIds?.length) {
        qb.andWhere(
          `(av."accountableId" IN (:...ids) OR av."editorId" IN (:...ids))`,
          { ids: query.assetUserScopeIds },
        );
      } else if (query.userScopeId) {
        qb.andWhere(`(av."accountableId" = :id OR av."editorId" = :id)`, {
          id: query.userScopeId,
        });
      }
    };

    const createdQb = this.assetVersionRepository
      .createQueryBuilder('av')
      .select(`DATE(av."createdAt" AT TIME ZONE 'UTC')`, 'date')
      .addSelect('COUNT(*)', 'count')
      .where(`av."deletedAt" IS NULL`)
      .andWhere(`av."createdAt" >= NOW() - INTERVAL '7 days'`);

    applyAccessFilters(createdQb);

    createdQb
      .groupBy(`DATE(av."createdAt" AT TIME ZONE 'UTC')`)
      .orderBy(`DATE(av."createdAt" AT TIME ZONE 'UTC')`, 'DESC');

    const createdRows = await createdQb.getRawMany();

    const modifiedQb = this.assetVersionRepository
      .createQueryBuilder('av')
      .select(`DATE(av."updatedAt" AT TIME ZONE 'UTC')`, 'date')
      .addSelect('COUNT(*)', 'count')
      .where(`av."deletedAt" IS NULL`)
      .andWhere(`av."updatedAt" >= NOW() - INTERVAL '7 days'`)
      .andWhere(`av."createdAt" < NOW() - INTERVAL '7 days'`);

    applyAccessFilters(modifiedQb);

    modifiedQb
      .groupBy(`DATE(av."updatedAt" AT TIME ZONE 'UTC')`)
      .orderBy(`DATE(av."updatedAt" AT TIME ZONE 'UTC')`, 'DESC');

    const modifiedRows = await modifiedQb.getRawMany();

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const createdMap = Object.fromEntries(
      createdRows.map((r) => [
        r.date.toISOString().split('T')[0],
        parseInt(r.count, 10),
      ]),
    );
    const modifiedMap = Object.fromEntries(
      modifiedRows.map((r) => [
        r.date.toISOString().split('T')[0],
        parseInt(r.count, 10),
      ]),
    );

    return dates.map((date) => ({
      date,
      created: createdMap[date] || 0,
      modified: modifiedMap[date] || 0,
    }));
  }

  //------------------------------
  async count(options?: FindManyOptions<AssetVersion>) {
    return this.assetVersionRepository.count(options);
  }

  //------------------------------
  async getAssetRelations(assetVersionId: string) {
    const assetVersion = await this.assetVersionRepository.findOne({
      where: { id: assetVersionId },
      relations: {
        assetTypeVersion: { assetType: true },
        asset: true,
      },
    });

    if (!assetVersion) {
      throw new NotFoundException({
        message: this.i18nService.t('messages.ERROR_ASSET_VERSION_NOT_FOUND'),
      });
    }

    const relations = await this.assetRelationRepository
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.parent', 'parentVersion')
      .leftJoinAndSelect('relation.child', 'childVersion')
      .leftJoinAndSelect('relation.assetRelationType', 'relationType')
      .where('relation.parentId = :id OR relation.childId = :id', {
        id: assetVersionId,
      })
      .orderBy('relation.createdAt', 'DESC')
      .getMany();

    const relatedVersionIds = new Set<string>();
    relations.forEach((relation) => {
      if (relation.parent?.id && relation.parent.id !== assetVersionId) {
        relatedVersionIds.add(relation.parent.id);
      }
      if (relation.child?.id && relation.child.id !== assetVersionId) {
        relatedVersionIds.add(relation.child.id);
      }
    });

    let relatedAssetVersions: AssetVersion[] = [];
    if (relatedVersionIds.size > 0) {
      relatedAssetVersions = await this.assetVersionRepository
        .createQueryBuilder('av')
        .innerJoin(
          (qb) => {
            return qb
              .select('sub."assetId"', 'asset_id')
              .addSelect('MAX(sub.baseline)', 'max_baseline')
              .from(AssetVersion, 'sub')
              .where('sub.id IN (:...ids)', { ids: [...relatedVersionIds] })
              .groupBy('sub."assetId"');
          },
          'latest',
          'av."assetId" = latest.asset_id AND av.baseline = latest.max_baseline',
        )
        .leftJoinAndSelect('av.assetTypeVersion', 'assetTypeVersion')
        .leftJoinAndSelect('assetTypeVersion.assetType', 'assetType')
        .leftJoinAndSelect('av.asset', 'asset')
        .getMany();
    }

    return {
      assetVersion,
      relations: relatedAssetVersions.map((version) => ({
        ...version,
        relationType: relations.find(
          (rel) => rel.parentId === version.id || rel.childId === version.id,
        )?.assetRelationType,
      })),
    };
  }

  //------------------------------
  create(entityLike: DeepPartial<AssetVersion>) {
    return this.assetVersionRepository.create(entityLike);
  }
}
