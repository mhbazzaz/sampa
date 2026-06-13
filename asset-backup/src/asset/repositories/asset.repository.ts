import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosRequestConfig } from 'axios';
import { Request } from 'express';
import { appendFile } from 'fs/promises';
import { I18nService } from 'nestjs-i18n';
import * as requestIp from 'request-ip';
import { ActionLogRepository } from 'src/action-log/repositories/action-log.repository';
import { AssetRelationType } from 'src/asset-relation-type/entities/asset-relation-type.entity';
import { AssetTypeVersion } from 'src/asset-type/entities/asset-type-version.entity';
import { AssetTypeRelationRepository } from 'src/asset-type/repositories/asset-type-relation.repository';
import { ElasticsearchClient } from 'src/common/elasticsearch/elasticsearch-client';
import {
  ActionLogStatusEnum,
  UserActionEnum,
} from 'src/common/enums/action-log.enum';
import { AssetTypeClassificationEnum } from 'src/common/enums/asset-type-classification.enum';
import { storeFailedCurlRequest } from 'src/common/helpers/store-failed-curl-request';
import { IDPUser } from 'src/common/interfaces/idp-user';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { AbstractRepository } from 'src/database/abstract.repository';
import { LocationRepository } from 'src/location/repositories/location.repository';
import { Role } from 'src/role/entities/role.entity';
import { Tag } from 'src/tag/entities/tag.entity';
import { TagRepository } from 'src/tag/repositories/tag.repository';
import { User } from 'src/users/entities/user.entity';
import { UsersRepository } from 'src/users/repositories/user.repository';
import { Vault } from 'src/vault/vault';
import {
  DataSource,
  FindManyOptions,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { CreateAssetDto } from '../dto/input/create-asset.dto';
import { FindAllAssetQueryWithOutPaginateDto } from '../dto/input/find-all-asset-without-paginate.dto';
import { UpdateAssetDto } from '../dto/input/update-asset.dto';
import { AssetRelation } from '../entities/asset-relation.entity';
import { AssetVersion } from '../entities/asset-version.entity';
import { Asset } from '../entities/asset.entity';
import { AssetRelationRepository } from './asset-relation.repository';
import { AssetScoringFactorRepository } from './asset-scoring-factor.repository';
import { AssetVersionRepository } from './asset-version.repository';

interface AssetChangeLog {
  updateData: string;
  oldValue: any;
  newValue: any;
  oldDisplayValue?: string | null;
  newDisplayValue?: string | null;
}

type FieldResolver =
  | {
      type: 'repository';
      repository: Repository<any>;
      labelField: string;
    }
  | {
      type: 'httpUser';
    };

@Injectable()
export class AssetRepository extends AbstractRepository<Asset> {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    private dataSource: DataSource,
    private assetVersionRepository: AssetVersionRepository,
    private assetScoringFactorRepository: AssetScoringFactorRepository,
    private usersRepository: UsersRepository,
    private tagRepository: TagRepository,
    private assetTypeRelationRepository: AssetTypeRelationRepository,
    private assetRelationRepository: AssetRelationRepository,
    private actionLogRepository: ActionLogRepository,
    private locationRepository: LocationRepository,
    private validationService: ValidationService,
    private readonly i18nService: I18nService,
  ) {
    super(assetRepository, i18nService);
  }

  //------------------------------
  async getLastRecord(): Promise<Asset | null> {
    return this.assetRepository
      .createQueryBuilder('asset')
      .orderBy('asset.createdAt', 'DESC')
      .getOne();
  }

  //------------------------------
  async findAllPaginationWithOutFilter(
    decodedFilters: string[] | undefined,
    decodedTags: string[] | undefined,
    query: FindAllAssetQueryWithOutPaginateDto,
  ): Promise<[Asset[], number]> {
    const qb = this.assetRepository.createQueryBuilder('asset');

    qb.leftJoinAndSelect('asset.assetType', 'assetType');
    qb.leftJoinAndSelect('assetType.assetCategory', 'assetCategory');

    qb.where('asset.archived = false');

    if (query.assetCategoryId) {
      qb.andWhere('assetType.assetCategory = :assetCategory', {
        assetCategory: query.assetCategoryId,
      });
    }

    if (query.name) {
      qb.andWhere('asset.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query.externalRefId) {
      qb.andWhere('asset.externalRefId = :externalRefId', {
        externalRefId: query.externalRefId,
      });
    }

    if (decodedFilters) {
      qb.innerJoinAndSelect('asset.filterValues', 'filterValue');

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
              `SELECT "assetId" FROM "filter_value_asset" where "filterValueId" = ANY($1)`,
              [decodedFilter.split(',')],
            )
          )?.map((data: { assetId: string }) => data.assetId),
        );
      }

      if (hasFilter) {
        const sharedValues = [...new Set(...filters)];

        if (sharedValues.length === 0) {
          return [[], 0];
        }
        qb.andWhere(`asset.id IN (:...ids)`, {
          ids: sharedValues,
        });
      }
    } else {
      qb.leftJoinAndSelect('asset.filterValues', 'filterValue');
    }

    if (decodedTags) {
      let tagAssets = await this.dataSource.query(
        `SELECT "assetId" FROM "tag_assets_asset" where "tagId" = ANY($1)`,
        [decodedTags],
      );

      if (tagAssets && tagAssets.length > 0) {
        tagAssets = tagAssets.map((tagAsset: any) => tagAsset.assetId);

        qb.innerJoinAndSelect('asset.tags', 'tag');

        const sharedValues = [...new Set(tagAssets)];

        if (sharedValues.length === 0) {
          return [[], 0];
        }
        qb.andWhere(`asset.id IN (:...ids)`, {
          ids: sharedValues,
        });
      }
    }

    qb.orderBy('asset.createdAt', 'DESC');

    return qb.getManyAndCount();
  }

  //------------------------------
  async count(options?: FindManyOptions<Asset>) {
    return this.assetRepository.count(options);
  }

  //------------------------------
  async createAssetWithVersions(
    data: CreateAssetDto,
    tags: Tag[],
    refId: string,
    accountableId: string,
    editorId: string,
    children: AssetVersion[],
    relatedAssets: {
      id: string;
      assetRelationType: AssetRelationType | undefined;
    }[],
    assetTypeVersion: AssetTypeVersion,
    user: IDPUser,
  ) {
    const {
      content,
      name,
      externalRefId,
      accountableUnitId,
      editorUnitId,
      financialScore,
      reputationScore,
      confidentialityScore,
      integrityScore,
      availabilityScore,
    } = data;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const createdAsset = await queryRunner.manager.save(
        Asset,
        new Asset({
          referenceId: refId,
          name,
          assetTypeId: assetTypeVersion.assetTypeId,
          tags,
          externalRefId,
        }),
      );

      const assetScoringFactories =
        await this.assetScoringFactorRepository.findAll({
          relations: { scores: true },
        });

      const scores = {
        financialScore: financialScore ? financialScore : 0,
        reputationScore: reputationScore ? reputationScore : 0,
        confidentialityScore: confidentialityScore ? confidentialityScore : 0,
        integrityScore: integrityScore ? integrityScore : 0,
        availabilityScore: availabilityScore ? availabilityScore : 0,
      };

      const Financial = assetScoringFactories.find(
        (assetScoringFactor) => assetScoringFactor.title === 'Financial',
      );

      const Integrity = assetScoringFactories.find(
        (assetScoringFactor) => assetScoringFactor.title === 'Integrity',
      );

      const Confidentiality = assetScoringFactories.find(
        (assetScoringFactor) => assetScoringFactor.title === 'Confidentiality',
      );

      const Reputation = assetScoringFactories.find(
        (assetScoringFactor) =>
          assetScoringFactor.title === 'Reputation / Regulatory',
      );

      const Availability = assetScoringFactories.find(
        (assetScoringFactor) => assetScoringFactor.title === 'Availability',
      );

      if (
        !Financial ||
        !Integrity ||
        !Confidentiality ||
        !Reputation ||
        !Availability
      ) {
        throw new InternalServerErrorException('');
      }

      const evaluationScore =
        scores.financialScore * Financial.weight +
        scores.confidentialityScore * Confidentiality.weight +
        scores.availabilityScore * Availability.weight +
        scores.integrityScore * Integrity.weight +
        scores.reputationScore * Reputation.weight;

      const createdAssetVersion = await queryRunner.manager.save(
        AssetVersion,
        new AssetVersion({
          baseline: '1',
          locationId: data.locationId,
          content: JSON.stringify(content),
          accountableUnitId: accountableUnitId,
          accountableId: accountableId,
          editorId,
          editorUnitId,
          assetId: createdAsset.id,
          assetTypeVersionId: assetTypeVersion.id,
          ...scores,
          evaluationScore: evaluationScore,
          updateUserId: user.id,
        }),
      );

      if (!createdAsset)
        throw new InternalServerErrorException('Error during creating asset');

      const assetRelations = children.map((child) => {
        const _child = relatedAssets.find(
          (item) => item.id === child.assetTypeVersionId,
        );

        if (!_child) {
          throw new BadRequestException({
            message: this.i18nService.t('messages.ERROR_NOT_FOUND_RECORD'),
          });
        }

        return new AssetRelation({
          assetRelationTypeId: _child.assetRelationType!.id,
          parentId: createdAssetVersion.id,
          childId: child.id,
        });
      });

      await queryRunner.manager.save(assetRelations);
      await queryRunner.commitTransaction();

      try {
        await ElasticsearchClient.instance.client.index({
          index: assetTypeVersion.id,
          id: createdAssetVersion.id,
          refresh: true,
          body: {
            ...content,
            referenceId: refId,
            baseline: '1',
            locationId: data.locationId,
            name,
            assetTypeVersionId: assetTypeVersion.id,
            tags,
            externalRefId,
            accountableUnitId: accountableUnitId,
            accountableId: accountableId,
            editorId,
            editorUnitId,
            archived: false,
            content: undefined,
          },
        });
      } catch (error) {
        console.log(error);
      }

      return createdAsset;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Transaction failed: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  //------------------------------
  async currentUserAssets(user: User, assetTypeId: string) {
    return this.assetRepository
      .createQueryBuilder('asset')
      .innerJoinAndSelect('asset.assetVersions', 'version')
      .where('asset.assetTypeId = :assetTypeId', { assetTypeId })
      .andWhere(
        '(version.editorId = :userId OR version.accountableId = :userId)',
        { userId: user.id },
      )
      .andWhere('version.archived = false')
      .andWhere('version.deletedAt IS NULL')
      .select([
        'asset.id',
        'asset.name',
        'asset.referenceId',
        'version.baseline',
        'asset.assetTypeId',
      ])
      .getMany();
  }

  //------------------------------
  async createAssetWithVersionsFromFile(
    data: CreateAssetDto,
    tags: Tag[],
    refId: string,
    accountableId: string,
    editorId: string,
    children: AssetVersion[],
    relatedAssets: {
      id: string;
      assetRelationType: AssetRelationType | undefined;
    }[],
    assetTypeVersion: AssetTypeVersion,
    user: User,
  ) {
    const errors: any[] = [];
    let createdAsset: Asset | null = null;

    const { content, name, externalRefId, accountableUnitId, editorUnitId } =
      data;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      createdAsset = await queryRunner.manager.save(
        Asset,
        new Asset({
          referenceId: refId,
          name,
          assetTypeId: assetTypeVersion.assetTypeId,
          tags,
          externalRefId,
        }),
      );

      if (!createdAsset) {
        await queryRunner.rollbackTransaction();
        errors.push({
          step: 'Creating Asset',
          message: 'Error during creating asset',
        });
        return { asset: null, errors };
      }

      const createdAssetVersion = await queryRunner.manager.save(
        AssetVersion,
        new AssetVersion({
          baseline: '1',
          locationId: data.locationId,
          content: JSON.stringify(content),
          accountableUnitId: accountableUnitId,
          accountableId: accountableId,
          editorId,
          editorUnitId,
          assetId: createdAsset.id,
          assetTypeVersionId: assetTypeVersion.id,
          updateUserId: user.id,
        }),
      );

      if (!createdAssetVersion) {
        await queryRunner.rollbackTransaction();
        errors.push({
          step: 'Creating Asset Version',
          message: 'Error during creating asset version',
        });
        return { asset: null, errors };
      }

      const assetRelations: AssetRelation[] = [];

      for (const child of children) {
        const _child = relatedAssets.find(
          (item) => item.id === child.assetTypeVersionId,
        );

        if (!_child) {
          errors.push({
            step: 'Mapping Asset Relations',
            message: 'Related asset record not found',
          });
          return { asset: null, errors };
        }

        assetRelations.push(
          new AssetRelation({
            assetRelationTypeId: _child.assetRelationType!.id,
            parentId: createdAssetVersion.id,
            childId: child.id,
          }),
        );
      }

      if (errors.length > 0) {
        await queryRunner.rollbackTransaction();
        return { asset: null, errors };
      }

      try {
        await ElasticsearchClient.instance.client.index({
          index: assetTypeVersion.id,
          id: createdAssetVersion.id,
          refresh: true,
          body: {
            ...content,
            referenceId: refId,
            baseline: '1',
            locationId: data.locationId,
            name,
            assetTypeVersionId: assetTypeVersion.id,
            tags,
            externalRefId,
            accountableUnitId: accountableUnitId,
            accountableId: accountableId,
            editorId,
            editorUnitId,
            archived: false,
            content: undefined,
          },
        });
      } catch (error) {
        console.log(error);
      }

      const savedRelations = await queryRunner.manager.save(assetRelations);
      if (!savedRelations) {
        await queryRunner.rollbackTransaction();
        errors.push({
          step: 'Saving Asset Relations',
          message: 'Error during saving asset relations',
        });
        return { asset: null, errors };
      }

      await queryRunner.commitTransaction();
      return { asset: createdAsset, errors };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errors.push({
        step: 'Transaction Execution',
        message: `Transaction failed: ${error.message}`,
      });
      return { asset: null, errors };
    } finally {
      await queryRunner.release();
    }
  }

  //------------------------------
  async updateTransaction(
    data: FindOptionsWhere<Asset>,
    updateAsset: UpdateAssetDto,
    user: IDPUser,
    userRoles: Role[],
    req: Request,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    const clientIp = requestIp.getClientIp(req as any);

    let logStatus: ActionLogStatusEnum = ActionLogStatusEnum.FAILED;
    let resultAssetVersion: AssetVersion | null = null;
    let changeLog: any[] = [];

    const oldAssetVersion = await this.assetVersionRepository.findOne({
      where: { id: data.id },
      relations: {
        asset: { tags: true },
        parents: true,
        children: true,
        assetTypeVersion: { assetType: true },
      },
      order: { createdAt: 'DESC' },
    });

    const assetId = oldAssetVersion?.assetId;
    if (!assetId) {
      throw new BadRequestException('Asset id is required for update');
    }

    if (
      oldAssetVersion.assetTypeVersion?.classification ===
      AssetTypeClassificationEnum.LogSource
    ) {
      updateAsset.externalRefId = undefined;
    }

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        name,
        content,
        tagIds,
        relatedAssetIds,
        accountableUnitId,
        editorUnitId,
        externalRefId,
        locationId,
        financialScore,
        reputationScore,
        confidentialityScore,
        integrityScore,
        availabilityScore,
      } = updateAsset;

      let { editorId, accountableId } = updateAsset;

      const hasNonContentUpdates = [
        name,
        tagIds,
        relatedAssetIds,
        accountableUnitId,
        editorUnitId,
        externalRefId,
        locationId,
        editorId,
        accountableId,
      ].some((val) => val !== undefined && val !== null);

      if (!hasNonContentUpdates && content === undefined) {
        throw new BadRequestException({
          message: this.i18nService.t('messages.ERROR_NO_UPDATES_PROVIDED'),
        });
      }

      if (!oldAssetVersion || !oldAssetVersion.asset) {
        throw new BadRequestException({
          message: this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
            args: { value: data.id, property: 'Asset' },
          }),
        });
      }

      const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
        'IDP_SERVICE_INTERNAL_TOKEN',
        'share',
      );
      const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

      try {
        if (accountableId) {
          const { data } = await axios.post(
            `${IDP_SERVICE_URL}/idp/api/v1/users`,
            { domain: 'iranet', employeeId: accountableId },
            {
              headers: {
                'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
              },
            },
          );

          await this.usersRepository.save(data.data);
          accountableId = data.data.id;
        }

        if (editorId) {
          const { data: data2 } = await axios.post(
            `${IDP_SERVICE_URL}/idp/api/v1/users`,
            { domain: 'iranet', employeeId: editorId },
            {
              headers: {
                'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
              },
            },
          );
          await this.usersRepository.save(data2.data);
          editorId = data2.data.id;
        }
      } catch (err) {
        throw new InternalServerErrorException(err.message);
      }

      const schema = oldAssetVersion?.content;
      if (!schema) {
        throw new BadRequestException({
          message: this.i18nService.t('messages.ERROR_SCHEMA_IS_NOT_DEFINED'),
        });
      }

      try {
        await this.validationService.validate(JSON.parse(schema), content);
      } catch (error) {
        console.log(error);
      }

      let tags: Tag[] = [];
      if (tagIds && tagIds.length > 0) {
        tags = await this.tagRepository.findAllFiltered({
          where: { id: In(tagIds), isEnabled: true },
          order: { createdAt: 'DESC' },
        });

        const existingTagIds = tags.map((tag) => tag.id);
        const missingTagIds = tagIds.filter(
          (id) => !existingTagIds.includes(id),
        );

        if (missingTagIds.length > 0) {
          throw new BadRequestException({
            message: this.i18nService.t('messages.ERROR_NOT_FOUND_TAGS', {
              args: { value: missingTagIds.join(', ') },
            }),
          });
        }
      }

      const existingRelations =
        await this.assetRelationRepository.findAllFiltered({
          where: [
            { parentId: oldAssetVersion.id },
            { childId: oldAssetVersion.id },
          ],
          order: { createdAt: 'DESC' },
        });

      const isSameName =
        name === undefined || name === oldAssetVersion.asset.name;
      const isSameExternalRefId =
        externalRefId === undefined ||
        externalRefId === oldAssetVersion.asset.externalRefId;
      const isSameAccountableUnitId =
        accountableUnitId === undefined ||
        accountableUnitId === oldAssetVersion.accountableUnitId;
      const isSameLocationId =
        locationId === undefined || locationId === oldAssetVersion.locationId;
      const isSameEditorUnitId =
        editorUnitId === undefined ||
        editorUnitId === oldAssetVersion.editorUnitId;
      const isSameAccountableId =
        (accountableId || oldAssetVersion.accountableId) ===
        oldAssetVersion.accountableId;
      const isSameEditorId =
        (editorId || oldAssetVersion.editorId) === oldAssetVersion.editorId;
      const isSameFinancialScore =
        (financialScore || oldAssetVersion.financialScore) ===
        oldAssetVersion.financialScore;
      const isSameReputationScore =
        (reputationScore || oldAssetVersion.reputationScore) ===
        oldAssetVersion.reputationScore;
      const isSameConfidentialityScore =
        (confidentialityScore || oldAssetVersion.confidentialityScore) ===
        oldAssetVersion.confidentialityScore;
      const isSameIntegrityScore =
        (integrityScore || oldAssetVersion.integrityScore) ===
        oldAssetVersion.integrityScore;
      const isSameAvailabilityScore =
        (availabilityScore || oldAssetVersion.availabilityScore) ===
        oldAssetVersion.availabilityScore;

      let isSameTags = true;
      if (tagIds) {
        const oldTagIds = (oldAssetVersion.asset.tags ?? [])
          .map((tag) => tag.id)
          .sort();
        const incomingTagIds = [...tagIds].sort();
        isSameTags =
          JSON.stringify(oldTagIds) === JSON.stringify(incomingTagIds);
      }

      let isSameRelations = true;
      if (relatedAssetIds) {
        const desiredRelatedIds = new Set(relatedAssetIds);
        const currentRelatedIds = new Set(
          existingRelations
            .flatMap((rel) => [rel.parentId, rel.childId])
            .filter((id) => id !== oldAssetVersion.id),
        );

        isSameRelations =
          desiredRelatedIds.size === currentRelatedIds.size &&
          [...desiredRelatedIds].every((id) => currentRelatedIds.has(id));
      }

      let isSameContent = true;
      if (content !== undefined) {
        const oldContentObj = oldAssetVersion.content
          ? JSON.parse(oldAssetVersion.content)
          : {};
        isSameContent = this.deepCompareObjects(content, oldContentObj);
      }

      let onlyRelationChanged = false;

      if (
        isSameName &&
        isSameExternalRefId &&
        isSameAccountableUnitId &&
        isSameEditorUnitId &&
        isSameAccountableId &&
        isSameEditorId &&
        isSameLocationId &&
        isSameFinancialScore &&
        isSameReputationScore &&
        isSameConfidentialityScore &&
        isSameIntegrityScore &&
        isSameAvailabilityScore &&
        isSameTags &&
        isSameContent
      ) {
        if (isSameRelations) {
          return oldAssetVersion;
        }
        onlyRelationChanged = true;
      }

      if (!onlyRelationChanged) {
        await queryRunner.manager.update(
          Asset,
          {
            id: oldAssetVersion.asset.id,
          },
          {
            name: name || oldAssetVersion.asset.name,
            externalRefId,
          },
        );

        // sync tags
        for (const categoryId of tags) {
          await queryRunner.manager
            .createQueryBuilder()
            .relation(Tag, 'tags')
            .of(categoryId)
            .add(categoryId);
        }

        for (const categoryId of tags) {
          await queryRunner.manager
            .createQueryBuilder()
            .relation(Tag, 'tags')
            .of(categoryId)
            .remove(categoryId);
        }
        // end sync tags

        const assetScoringFactories =
          await this.assetScoringFactorRepository.findAll({
            relations: { scores: true },
          });

        const scores = {
          financialScore: financialScore
            ? financialScore
            : oldAssetVersion.financialScore,
          reputationScore: reputationScore
            ? reputationScore
            : oldAssetVersion.reputationScore,
          confidentialityScore: confidentialityScore
            ? confidentialityScore
            : oldAssetVersion.confidentialityScore,
          integrityScore: integrityScore
            ? integrityScore
            : oldAssetVersion.integrityScore,
          availabilityScore: availabilityScore
            ? availabilityScore
            : oldAssetVersion.availabilityScore,
        };

        const Financial = assetScoringFactories.find(
          (assetScoringFactor) => assetScoringFactor.title === 'Financial',
        );

        const Integrity = assetScoringFactories.find(
          (assetScoringFactor) => assetScoringFactor.title === 'Integrity',
        );

        const Confidentiality = assetScoringFactories.find(
          (assetScoringFactor) =>
            assetScoringFactor.title === 'Confidentiality',
        );

        const Reputation = assetScoringFactories.find(
          (assetScoringFactor) =>
            assetScoringFactor.title === 'Reputation / Regulatory',
        );

        const Availability = assetScoringFactories.find(
          (assetScoringFactor) => assetScoringFactor.title === 'Availability',
        );

        if (
          !Financial ||
          !Integrity ||
          !Confidentiality ||
          !Reputation ||
          !Availability
        ) {
          throw new InternalServerErrorException('');
        }

        const evaluationScore =
          scores.financialScore * Financial.weight +
          scores.confidentialityScore * Confidentiality.weight +
          scores.availabilityScore * Availability.weight +
          scores.integrityScore * Integrity.weight +
          scores.reputationScore * Reputation.weight;

        const newAssetVersion = await queryRunner.manager.save(AssetVersion, {
          baseline: (parseInt(oldAssetVersion.baseline) + 1).toString(),
          assetTypeVersionId: oldAssetVersion.assetTypeVersionId,
          content: content ? JSON.stringify(content) : oldAssetVersion.content,
          locationId: locationId ? locationId : undefined,
          accountableId: accountableId || oldAssetVersion.accountableId,
          accountableUnitId:
            accountableUnitId || oldAssetVersion.accountableUnitId,
          editorId: editorId || oldAssetVersion.editorId,
          editorUnitId: editorUnitId || oldAssetVersion.editorUnitId,
          assetId: oldAssetVersion.asset.id,
          updateUserId: user.id,
          ...scores,
          evaluationScore: evaluationScore,
        });

        try {
          await ElasticsearchClient.instance.client.index({
            index: newAssetVersion.assetTypeVersionId,
            id: newAssetVersion.id,
            body: {
              ...(content ? content : JSON.parse(oldAssetVersion.content)),
              referenceId: oldAssetVersion.asset.referenceId,
              baseline: (parseInt(oldAssetVersion.baseline) + 1).toString(),
              name: name || oldAssetVersion.asset.name,
              assetTypeVersionId: oldAssetVersion.assetTypeVersionId,
              tags,
              locationId: locationId ? locationId : undefined,
              accountableId: accountableId || oldAssetVersion.accountableId,
              accountableUnitId:
                accountableUnitId || oldAssetVersion.accountableUnitId,
              editorId: editorId || oldAssetVersion.editorId,
              editorUnitId: editorUnitId || oldAssetVersion.editorUnitId,
              externalRefId,
              archived: false,
              content: undefined,
            },
          });
          await ElasticsearchClient.instance.client.update({
            index: oldAssetVersion.assetTypeVersionId,
            id: oldAssetVersion.id,
            doc: {
              archived: true,
            },
          });
          await ElasticsearchClient.instance.client.indices.refresh({
            index: 'assets',
          });

          // end relation with other fields changed
        } catch (error) {
          console.log(error);
        }

        // start relation with other fields changed
        const inheritedRelations = existingRelations
          .filter((rel) => {
            if (
              rel.parentId === oldAssetVersion.id ||
              rel.childId === oldAssetVersion.id
            ) {
              const otherAssetId =
                rel.parentId === oldAssetVersion.id
                  ? rel.childId
                  : rel.parentId;
              return relatedAssetIds?.includes(otherAssetId);
            }
            return false;
          })
          .map((rel) => ({
            assetRelationTypeId: rel.assetRelationTypeId,
            parentId:
              rel.parentId === oldAssetVersion.id
                ? newAssetVersion.id
                : rel.parentId,
            childId:
              rel.childId === oldAssetVersion.id
                ? newAssetVersion.id
                : rel.childId,
          }));

        const newRelations: any[] = [];

        if (relatedAssetIds && relatedAssetIds.length > 0) {
          const relatedAssets = await this.assetVersionRepository.findAll({
            where: { id: In(relatedAssetIds) },
            relations: { assetTypeVersion: { assetType: true } },
          });

          const foundAssetsMap = new Map(
            relatedAssets.map((asset) => [asset.id, asset]),
          );

          const foundIds = relatedAssets.map((a) => a.id);
          const missing = relatedAssetIds.filter(
            (id) => !foundIds.includes(id),
          );

          if (missing.length > 0) {
            throw new BadRequestException({
              message: this.i18nService.t(
                'messages.ERROR_PROPERTY_ID_INVALID',
                {
                  args: { value: missing.join(', '), property: 'Asset' },
                },
              ),
            });
          }

          for (const relatedAssetId of relatedAssetIds) {
            const isNewRelation = !existingRelations.some(
              (rel) =>
                (rel.parentId === oldAssetVersion.id &&
                  rel.childId === relatedAssetId) ||
                (rel.childId === oldAssetVersion.id &&
                  rel.parentId === relatedAssetId),
            );

            if (isNewRelation) {
              const relatedAsset = foundAssetsMap.get(relatedAssetId)!;

              const assetTypeRelationType =
                await this.assetTypeRelationRepository.findOne({
                  where: [
                    {
                      parentId: oldAssetVersion.assetTypeVersionId,
                      childId: relatedAsset.assetTypeVersionId,
                    },
                    {
                      childId: oldAssetVersion.assetTypeVersionId,
                      parentId: relatedAsset.assetTypeVersionId,
                    },
                  ],
                });

              if (!assetTypeRelationType?.assetRelationTypeId) {
                throw new BadRequestException({
                  message: this.i18nService.t(
                    'messages.ERROR_ASSET_RELATIONSHIP_NOT_FOUND',
                    {
                      args: {
                        value1: `${oldAssetVersion.assetTypeVersion?.assetType?.name}:v${oldAssetVersion.assetTypeVersion?.version}`,
                        value2: `${relatedAsset.assetTypeVersion?.assetType?.name}:v${relatedAsset.assetTypeVersion?.version}`,
                      },
                    },
                  ),
                });
              }

              newRelations.push({
                assetRelationTypeId: assetTypeRelationType?.assetRelationTypeId,
                parentId: newAssetVersion.id,
                childId: relatedAsset.id,
              });
            }
          }
        }

        // await this.assetRelationRepository.saveMany([
        //   ...inheritedRelations,
        //   ...newRelations,
        // ]);
        await queryRunner.manager.save(AssetRelation, [
          ...inheritedRelations,
          ...newRelations,
        ]);

        oldAssetVersion.archived = true;
        await queryRunner.manager.save(AssetVersion, oldAssetVersion);

        await queryRunner.commitTransaction();
        logStatus = ActionLogStatusEnum.SUCCESS;

        resultAssetVersion = newAssetVersion;
        changeLog = this.buildChangeLog(
          oldAssetVersion.asset,
          oldAssetVersion,
          resultAssetVersion,
          updateAsset,
        );
        return resultAssetVersion;
      } else {
        //started relation without other fields

        const relationsToRemove = existingRelations.filter((rel) => {
          if (
            rel.parentId === oldAssetVersion.id ||
            rel.childId === oldAssetVersion.id
          ) {
            const otherAssetId =
              rel.parentId === oldAssetVersion.id ? rel.childId : rel.parentId;
            return !relatedAssetIds?.includes(otherAssetId);
          }
          return false;
        });

        if (relationsToRemove.length > 0) {
          queryRunner.manager.softDelete(
            AssetRelation,
            relationsToRemove.map((oldRelation) => oldRelation.id),
          );
        }

        const newRelations: any[] = [];

        if (relatedAssetIds && relatedAssetIds.length > 0) {
          const relatedAssets = await this.assetVersionRepository.findAll({
            where: { id: In(relatedAssetIds) },
            relations: { assetTypeVersion: { assetType: true } },
          });

          const foundAssetsMap = new Map(
            relatedAssets.map((asset) => [asset.id, asset]),
          );

          const foundIds = relatedAssets.map((a) => a.id);
          const missing = relatedAssetIds.filter(
            (id) => !foundIds.includes(id),
          );

          if (missing.length > 0) {
            throw new BadRequestException({
              message: this.i18nService.t(
                'messages.ERROR_PROPERTY_ID_INVALID',
                {
                  args: { value: missing.join(', '), property: 'Asset' },
                },
              ),
            });
          }

          for (const relatedAssetId of relatedAssetIds) {
            const isNewRelation = !existingRelations.some(
              (rel) =>
                (rel.parentId === oldAssetVersion.id &&
                  rel.childId === relatedAssetId) ||
                (rel.childId === oldAssetVersion.id &&
                  rel.parentId === relatedAssetId),
            );

            if (isNewRelation) {
              const relatedAsset = foundAssetsMap.get(relatedAssetId)!;

              const assetTypeRelationType =
                await this.assetTypeRelationRepository.findOne({
                  where: [
                    {
                      parentId: oldAssetVersion.assetTypeVersionId,
                      childId: relatedAsset.assetTypeVersionId,
                    },
                    {
                      childId: oldAssetVersion.assetTypeVersionId,
                      parentId: relatedAsset.assetTypeVersionId,
                    },
                  ],
                });

              if (!assetTypeRelationType?.assetRelationTypeId) {
                throw new BadRequestException({
                  message: this.i18nService.t(
                    'messages.ERROR_ASSET_RELATIONSHIP_NOT_FOUND',
                    {
                      args: {
                        value1: `${oldAssetVersion.assetTypeVersion?.assetType?.name}:v${oldAssetVersion.assetTypeVersion?.version}`,
                        value2: `${relatedAsset.assetTypeVersion?.assetType?.name}:v${relatedAsset.assetTypeVersion?.version}`,
                      },
                    },
                  ),
                });
              }

              newRelations.push({
                assetRelationTypeId: assetTypeRelationType?.assetRelationTypeId,
                parentId: oldAssetVersion.id,
                childId: relatedAsset.id,
              });
            }
          }
          await queryRunner.manager.save(AssetRelation, newRelations);
        }
        //finished relation without other fields

        if (
          oldAssetVersion.assetTypeVersion?.classification ===
          AssetTypeClassificationEnum.LogSource
        ) {
          const { content } = updateAsset as {
            content: {
              HostName: string;
              IPAddress: string;
              Type: { ID: number; Name: string };
              ProtocolType: { ID: number; Name: string };
              QradarGroup: { ID: number; Name: string };
              Status: string;
            };
          };

          const LSW_TOKEN = await Vault.instance.get('LSW_TOKEN');
          const LSW_URL = await Vault.instance.get('LSW_URL');

          const url = `${LSW_URL}/log-source/${oldAssetVersion.asset.externalRefId}`;
          const payload = {
            log_source_type_id: content.Type.ID,
            protocol_type_id: content.ProtocolType.ID,
            ip: content.IPAddress,
            hostname: content.HostName,
            group_ids: [content.QradarGroup.ID],
          };
          const config: AxiosRequestConfig = {
            headers: {
              'X-Server-Auth-Key': LSW_TOKEN,
              'X-Server-Username': user.username,
            },
          };

          try {
            await axios.put(url, payload, config);
          } catch (error) {
            const curlCommand = storeFailedCurlRequest(
              url,
              'PUT',
              payload,
              config.headers,
              error,
            );

            const timestamp = new Date().toISOString().replace(/:/g, '-');

            await appendFile(
              'failed_requests.log',
              `\n--- FAILED REQUEST ${timestamp} ---\n${curlCommand}\n`,
            );

            throw error;
          }
        }

        await queryRunner.commitTransaction();
        logStatus = ActionLogStatusEnum.SUCCESS;

        resultAssetVersion = oldAssetVersion;
        changeLog = this.buildChangeLog(
          oldAssetVersion.asset,
          oldAssetVersion,
          resultAssetVersion,
          updateAsset,
        );
        return resultAssetVersion;
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logStatus = ActionLogStatusEnum.FAILED;

      throw error;
    } finally {
      await queryRunner.release();

      const changesWithNames =
        await this.enrichChangesWithDisplayValues(changeLog);

      await this.actionLogRepository.save({
        action: UserActionEnum.UPDATE_ASSET,
        ipAddress: clientIp,
        roleIds: userRoles.map((r) => r.id),
        status: logStatus,
        userId: user.id,
        assetId,
        assetOldBaseline: oldAssetVersion?.baseline,
        assetNewBaseline: resultAssetVersion?.baseline,
        changes: changesWithNames,
      });
    }
  }

  //------------------------------
  async findOneCaseInsensitive(
    field: keyof Asset,
    value: string,
    assetTypeId: string,
    withVersions = false,
  ): Promise<Asset | null> {
    const lowerValue = value.toLowerCase();
    const qb = this.assetRepository
      .createQueryBuilder('asset')
      .where(`LOWER(asset.${field}) = :value`, { value: lowerValue })
      .andWhere('asset.assetTypeId = :assetTypeId', { assetTypeId });

    if (withVersions) {
      qb.leftJoinAndSelect('asset.assetVersions', 'assetVersions').orderBy(
        'assetVersions.createdAt',
        'DESC',
      );
    }

    return qb.getOne();
  }

  //------------------------------
  deepCompareObjects(objOne: any, objTwo: any): boolean {
    if (objOne === objTwo) return true;

    if (
      typeof objOne !== 'object' ||
      objOne === null ||
      typeof objTwo !== 'object' ||
      objTwo === null
    ) {
      return false;
    }

    const keys1 = Object.keys(objOne);
    const keys2 = Object.keys(objTwo);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }

      if (!this.deepCompareObjects(objOne[key], objTwo[key])) {
        return false;
      }
    }

    return true;
  }

  //------------------------------
  private readonly FIELD_RESOLVERS: Record<string, FieldResolver> = {
    locationId: {
      type: 'repository',
      repository: this.locationRepository as unknown as Repository<any>,
      labelField: 'name',
    },

    editorId: {
      type: 'httpUser',
    },
    accountableId: {
      type: 'httpUser',
    },
  };

  //------------------------------
  private async fetchUsersByIds(userIds: string[]): Promise<Map<string, any>> {
    const uniqueIds = [...new Set(userIds)].filter(Boolean);
    const userMap = new Map<string, any>();

    if (!uniqueIds.length) return userMap;

    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const { data } = await axios.get(
            `${IDP_SERVICE_URL}/idp/api/v1/users/${id}`,
            {
              headers: {
                'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
              },
            },
          );

          userMap.set(id, data.data);
        } catch (error) {
          console.log(`Failed to fetch user ${id}`, error);
          userMap.set(id, null);
        }
      }),
    );

    return userMap;
  }

  //------------------------------
  private buildChangeLog(
    beforeAsset: Asset,
    beforeVersion: AssetVersion,
    afterVersion: AssetVersion | null,
    updateDto: UpdateAssetDto,
  ): AssetChangeLog[] {
    const changes: AssetChangeLog[] = [];

    const addSimpleChange = (field: string, oldVal: any, newVal: any) => {
      if (newVal === undefined) return;
      if (oldVal === newVal) return;

      changes.push({
        updateData: field,
        oldValue: oldVal,
        newValue: newVal,
      });
    };

    addSimpleChange('name', beforeAsset.name, updateDto.name);
    addSimpleChange(
      'externalRefId',
      beforeAsset.externalRefId,
      updateDto.externalRefId,
    );

    if (updateDto.content !== undefined) {
      const normalizeContent = (value: any) => {
        if (!value) return value;
        const clone = JSON.parse(JSON.stringify(value));
        delete clone.baseline;
        return clone;
      };

      const oldContent = normalizeContent(
        beforeVersion.content ? JSON.parse(beforeVersion.content) : null,
      );

      const newContent = normalizeContent(updateDto.content);

      if (!this.deepCompareObjects(oldContent, newContent)) {
        this.collectNestedChanges(oldContent, newContent, 'content', changes);
      }
    }

    addSimpleChange(
      'financialScore',
      beforeVersion.financialScore,
      afterVersion?.financialScore,
    );
    addSimpleChange(
      'reputationScore',
      beforeVersion.reputationScore,
      afterVersion?.reputationScore,
    );
    addSimpleChange(
      'confidentialityScore',
      beforeVersion.confidentialityScore,
      afterVersion?.confidentialityScore,
    );
    addSimpleChange(
      'integrityScore',
      beforeVersion.integrityScore,
      afterVersion?.integrityScore,
    );
    addSimpleChange(
      'availabilityScore',
      beforeVersion.availabilityScore,
      afterVersion?.availabilityScore,
    );
    addSimpleChange(
      'accountableId',
      beforeVersion.accountableId,
      afterVersion?.accountableId,
    );
    addSimpleChange('editorId', beforeVersion.editorId, afterVersion?.editorId);
    addSimpleChange(
      'accountableUnitId',
      beforeVersion.accountableUnitId,
      afterVersion?.accountableUnitId,
    );
    addSimpleChange(
      'editorUnitId',
      beforeVersion.editorUnitId,
      afterVersion?.editorUnitId,
    );
    addSimpleChange(
      'locationId',
      beforeVersion.locationId,
      afterVersion?.locationId,
    );

    return changes;
  }

  //------------------------------
  private async enrichChangesWithDisplayValues(
    changes: AssetChangeLog[],
  ): Promise<AssetChangeLog[]> {
    const userIds: string[] = [];

    for (const change of changes) {
      const resolver = this.FIELD_RESOLVERS[change.updateData];
      if (!resolver) continue;

      if (resolver.type === 'httpUser') {
        if (change.oldValue) userIds.push(change.oldValue);
        if (change.newValue) userIds.push(change.newValue);
      }
    }

    const usersById = await this.fetchUsersByIds(userIds);

    for (const change of changes) {
      const resolver = this.FIELD_RESOLVERS[change.updateData];
      if (!resolver) continue;

      if (resolver.type === 'repository') {
        const { repository, labelField } = resolver;

        if (change.oldValue) {
          const oldEntity = await repository.findOne({
            where: { id: change.oldValue },
          });
          change.oldDisplayValue = oldEntity?.[labelField] ?? null;
        }

        if (change.newValue) {
          const newEntity = await repository.findOne({
            where: { id: change.newValue },
          });
          change.newDisplayValue = newEntity?.[labelField] ?? null;
        }
      }

      if (resolver.type === 'httpUser') {
        const oldUser = change.oldValue ? usersById.get(change.oldValue) : null;
        const newUser = change.newValue ? usersById.get(change.newValue) : null;

        change.oldDisplayValue = oldUser
          ? `${oldUser.firstName} ${oldUser.lastName}`
          : null;

        change.newDisplayValue = newUser
          ? `${newUser.firstName} ${newUser.lastName}`
          : null;
      }
    }

    return changes;
  }

  //------------------------------
  private collectNestedChanges(
    oldObj: any,
    newObj: any,
    basePath: string,
    changes: {
      updateData: string;
      oldValue: any;
      newValue: any;
    }[],
  ) {
    if (this.deepCompareObjects(oldObj, newObj)) {
      return;
    }

    if (
      typeof oldObj !== 'object' ||
      oldObj === null ||
      typeof newObj !== 'object' ||
      newObj === null
    ) {
      changes.push({
        updateData: basePath,
        oldValue: oldObj,
        newValue: newObj,
      });
      return;
    }

    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of keys) {
      this.collectNestedChanges(
        oldObj?.[key],
        newObj?.[key],
        `${basePath}/${key}`,
        changes,
      );
    }
  }
}
