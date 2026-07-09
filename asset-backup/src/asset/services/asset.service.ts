import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as ExcelJS from 'exceljs';
import { Row } from 'exceljs';
import { Request, Response } from 'express';
import { CsvFormatterStream, format } from 'fast-csv';
import { appendFile } from 'fs/promises';
import { I18nService } from 'nestjs-i18n';
import * as requestIp from 'request-ip';
import { ActionLogRepository } from 'src/action-log/repositories/action-log.repository';
import { AssetTypeVersionRepository } from 'src/asset-type/repositories/asset-type-version.repository';
import { AssetTypeRepository } from 'src/asset-type/repositories/asset-type.repository';
import { ElasticsearchClient } from 'src/common/elasticsearch/elasticsearch-client';
import {
  ActionLogStatusEnum,
  UserActionEnum,
} from 'src/common/enums/action-log.enum';
import { AssetRoles } from 'src/common/enums/asset-roles.enum';
import { AssetStatusEnum } from 'src/common/enums/asset-status.enum';
import { AssetTypeClassificationEnum } from 'src/common/enums/asset-type-classification.enum';
import {
  getSearchablePaths,
  getValuesFromJSON,
} from 'src/common/helpers/get-searchable-values';
import isObject from 'src/common/helpers/is-object';
import { safeJsonParse } from 'src/common/helpers/safe-json-parse';
import { storeFailedCurlRequest } from 'src/common/helpers/store-failed-curl-request';
import { userMapperSingular } from 'src/common/helpers/user-mapper-singular';
import { IDPUser } from 'src/common/interfaces/idp-user';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { FilterValue } from 'src/filter/entities/filter-value.entity';
import { Filter } from 'src/filter/entities/filter.entity';
import { FilterValueRepository } from 'src/filter/repositories/filter-value.repository';
import { LocationTypeRepository } from 'src/location-type/repositories/location-type.repository';
import { LocationRepository } from 'src/location/repositories/location.repository';
import { Role } from 'src/role/entities/role.entity';
import { Tag } from 'src/tag/entities/tag.entity';
import { TagRepository } from 'src/tag/repositories/tag.repository';
import { User } from 'src/users/entities/user.entity';
import { UsersRepository } from 'src/users/repositories/user.repository';
import { Vault } from 'src/vault/vault';
import { FindOneOptions, FindOptionsWhere, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { assetBodyReportJsonDto } from '../dto/input/asset-body-report-json.dto';
import { AssetChangeStatusDto } from '../dto/input/asset-change-status.dto';
import { assetSearchBodyReportExportExcelDto } from '../dto/input/asset-search-body-report-export-excel.dto';
import { assetSearchBodyReportDto } from '../dto/input/asset-search-body-report.dto';
import { CreateAssetDto } from '../dto/input/create-asset.dto';
import { FindAllAssetQueryDto } from '../dto/input/find-all-asset-query.dto';
import { findAllAssetReportQueryDto } from '../dto/input/find-all-asset-report.query.dto';
import { FindAllAssetQueryWithOutPaginateDto } from '../dto/input/find-all-asset-without-paginate.dto';
import { GetFilteredAssetVersions } from '../dto/input/get-filtered-asset-versions.dto';
import { GetLogSourceGroupsDTO } from '../dto/input/get-log-source-groups.dto';
import { UpdateAssetDto } from '../dto/input/update-asset.dto';
import { LogSourceType } from '../dto/Log-Source-Type.dto';
import { ProtocolType } from '../dto/Protocol-Type.dto';
import { CreatedAssetFromFileResponseDto } from '../dto/response/created-from-file-response.dto';
import { AssetVersion } from '../entities/asset-version.entity';
import { Asset } from '../entities/asset.entity';
import { AssetRelationRepository } from '../repositories/asset-relation.repository';
import { AssetVersionRepository } from '../repositories/asset-version.repository';
import { AssetRepository } from '../repositories/asset.repository';

export interface searchBody {
  [name: string]: searchBody | string;
}

export type searchBodyTag = searchBody & {
  tags?: string[];
};

@Injectable()
export class AssetService {
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly assetVersionRepository: AssetVersionRepository,
    private readonly locationTypeRepository: LocationTypeRepository,
    private readonly locationRepository: LocationRepository,
    private readonly assetTypeVersionRepository: AssetTypeVersionRepository,
    private readonly assetTypeRepository: AssetTypeRepository,
    private readonly assetRelationRepository: AssetRelationRepository,
    private readonly validationService: ValidationService,
    private readonly filterValueRepository: FilterValueRepository,
    private readonly usersRepository: UsersRepository,
    private readonly tagRepository: TagRepository,
    private readonly actionLogRepository: ActionLogRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async findFilter(
    content: object,
    filters: Filter[],
    filterValues: FilterValue[],
  ) {
    for (const [key, value] of Object.entries(content)) {
      if (isObject(value)) {
        await this.findFilter(value, filters, filterValues);
        continue;
      }
      const existingFilter = filters.findIndex((filter) => filter.key === key);
      if (existingFilter > -1) {
        const filter = filters[existingFilter];
        const filterValue = await this.filterValueRepository.findOne({
          where: {
            filterId: filter.id,
            value: value,
          },
        });
        if (filterValue) {
          filterValues.push(filterValue);
        }
      }
    }
  }

  //------------------------------
  async create(
    user: IDPUser,
    userRoles: Role[],
    data: CreateAssetDto,
    req: Request,
  ) {
    const { assetTypeVersionId, content, tagIds, relatedAssetIds } = data;
    let { editorId, accountableId } = data;

    const clientIp = requestIp.getClientIp(req as any);

    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    try {
      const { data: accountableResponse } = await axios.post(
        `${IDP_SERVICE_URL}/idp/api/v1/users`,
        {
          domain: 'iranet',
          employeeId: accountableId,
        },
        {
          headers: {
            'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
          },
        },
      );
      await this.usersRepository.save(accountableResponse.data);
      accountableId = accountableResponse.data.id;

      if (editorId) {
        const { data: editorResponse } = await axios.post(
          `${IDP_SERVICE_URL}/idp/api/v1/users`,
          {
            domain: 'iranet',
            employeeId: editorId,
          },
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );
        await this.usersRepository.save(editorResponse.data);
        editorId = editorResponse.data.id;
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    const hasAdministratorRole = userRoles.some(
      (r) => r.name === AssetRoles.AssetAdministrator,
    );

    if (!hasAdministratorRole) {
      const isAssetUser = userRoles.some(
        (r) => r.name === AssetRoles.AssetUser,
      );
      const isAssetSupervisor = userRoles.some(
        (r) => r.name === AssetRoles.AssetSupervisor,
      );

      if (isAssetUser && !isAssetSupervisor) {
        const isDirectlyInvolved =
          user.id === accountableId || user.id === editorId;

        if (!isDirectlyInvolved) {
          throw new BadRequestException(
            this.i18nService.t(
              'messages.ERROR_NOT_AUTHORIZED_TO_CREATE_OR_UPDATE_ASSET',
            ),
          );
        }
      }
    }

    const existingAssetTypeVersion =
      await this.assetTypeVersionRepository.findOne({
        where: { id: assetTypeVersionId, archived: false },
        relations: {
          assetType: true,
          filters: true,
          parents: { assetRelationType: true },
          children: { assetRelationType: true },
        },
      });

    if (!existingAssetTypeVersion) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'AssetTypeVersion' },
        }),
      );
    }

    const filterValues: FilterValue[] = [];
    const { filters } = existingAssetTypeVersion;

    if (filters) {
      await this.findFilter(content, filters, filterValues);
    }

    const children: AssetVersion[] = [];
    const relation: {
      childId: string;
      assetRelationTypeId: string;
    }[] = [];

    const parentIds = existingAssetTypeVersion.parents?.map((parent) => {
      return {
        id: parent.parentId,
        assetRelationType: parent.assetRelationType,
      };
    });

    const childIds = existingAssetTypeVersion.children?.map((child) => {
      return {
        id: child.childId,
        assetRelationType: child.assetRelationType,
      };
    });
    const relatedAssets = [...(parentIds || []), ...(childIds || [])];

    if (relatedAssetIds && relatedAssetIds.length > 0) {
      for (const assetId of relatedAssetIds) {
        const existingAsset = await this.assetVersionRepository.findOne({
          where: { id: assetId },
          relations: { asset: true },
        });

        if (!existingAsset) {
          throw new BadRequestException(
            this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
              args: { property: 'relatedAssetIds' },
            }),
          );
        }

        if (
          relatedAssets.findIndex(
            (element) => element.id === existingAsset.assetTypeVersionId,
          ) === -1
        ) {
          throw new BadRequestException(
            this.i18nService.t('messages.ERROR_ASSET_CAN_NOT_BE_ASSIGNED'),
          );
        }

        relation.push({
          childId: existingAsset.id,
          assetRelationTypeId: existingAsset.assetTypeVersionId,
        });
        children.push(existingAsset);
      }
    }

    const refId = `${existingAssetTypeVersion.assetType?.code}-${uuidv4()}`;

    const schema = existingAssetTypeVersion.content;
    if (!schema) {
      throw new BadRequestException({
        message: this.i18nService.t('messages.ERROR_SCHEMA_VALIDATION_FAILED'),
      });
    }

    await this.validationService.validate(JSON.parse(schema), content);

    let tags: Tag[] = [];
    if (tagIds && tagIds.length > 0) {
      tags = await this.tagRepository.findAllFiltered({
        where: { id: In(tagIds), isEnabled: true },
        order: { createdAt: 'DESC' },
      });

      if (tags.length !== tagIds.length) {
        const missingTagIds = tagIds.filter(
          (id) => !tags.some((tag) => tag.id === id),
        );

        throw new BadRequestException({
          message: this.i18nService.t(
            'messages.ERROR_SCHEMA_VALIDATION_FAILED',
            {
              args: { value: missingTagIds.join(', ') },
            },
          ),
        });
      }
    }

    let createdVersion: Asset | null = null;
    let logStatus: ActionLogStatusEnum = ActionLogStatusEnum.FAILED;

    try {
      if (
        existingAssetTypeVersion.classification ===
        AssetTypeClassificationEnum.LogSource
      ) {
        const { content } = data as {
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

        const url = `${LSW_URL}/log-source/`;
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
          const res = await axios.post(url, payload, config);
          data.externalRefId = res.data.id;
        } catch (error) {
          const curlCommand = storeFailedCurlRequest(
            url,
            'POST',
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

      createdVersion = await this.assetRepository.createAssetWithVersions(
        data,
        tags,
        refId,
        accountableId,
        editorId,
        children,
        relatedAssets,
        existingAssetTypeVersion,
        user,
      );

      logStatus = ActionLogStatusEnum.SUCCESS;
      return createdVersion;
    } catch (error) {
      logStatus = ActionLogStatusEnum.FAILED;
      throw error;
    } finally {
      await this.actionLogRepository.save({
        userId: user.id,
        ipAddress: clientIp,
        roleIds: userRoles.map((r) => r.id),
        action: UserActionEnum.CREATE_ASSET,
        status: logStatus,
        assetId: createdVersion ? createdVersion.id : '',
        assetOldBaseline: null,
        assetNewBaseline: '1',
      });
    }
  }

  //------------------------------
  async createFromFile(
    user: User,
    userRoles: Role[],
    data: CreateAssetDto,
  ): Promise<CreatedAssetFromFileResponseDto> {
    const errors: any[] = [];

    const { assetTypeVersionId, content, tagIds, relatedAssetIds } = data;
    let { editorId, accountableId } = data;

    try {
      let IDP_SERVICE_INTERNAL_TOKEN, IDP_SERVICE_URL;
      try {
        IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
          'IDP_SERVICE_INTERNAL_TOKEN',
          'share',
        );
        IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');
      } catch (err) {
        errors.push({ step: 'Fetching Env Variables', message: err.message });
        return { errors };
      }

      try {
        const { data: idpData } = await axios.post(
          `${IDP_SERVICE_URL}/idp/api/v1/users`,
          { domain: 'iranet', employeeId: accountableId },
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );
        await this.usersRepository.save(idpData.data);
        accountableId = idpData.data.id;

        if (editorId) {
          const { data: idpData2 } = await axios.post(
            `${IDP_SERVICE_URL}/idp/api/v1/users`,
            { domain: 'iranet', employeeId: editorId },
            {
              headers: {
                'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
              },
            },
          );
          await this.usersRepository.save(idpData2.data);
          editorId = idpData2.data.id;
        }
      } catch (err) {
        errors.push({ step: 'Fetching User Info', message: err.message });
        return { errors };
      }

      const existingAssetTypeVersion =
        await this.assetTypeVersionRepository.findOne({
          where: { id: assetTypeVersionId, archived: false },
          relations: {
            assetType: true,
            filters: true,
            parents: { assetRelationType: true },
            children: { assetRelationType: true },
          },
        });

      if (!existingAssetTypeVersion) {
        errors.push({
          step: 'Asset Type Version Lookup',
          message: `Asset-Type-Version with id ${assetTypeVersionId} does not exist`,
        });
        return { errors };
      }

      const children: AssetVersion[] = [];
      const relation: {
        childId: string;
        assetRelationTypeId: string;
      }[] = [];

      const parentIds = existingAssetTypeVersion.parents?.map((parent) => {
        return {
          id: parent.parentId,
          assetRelationType: parent.assetRelationType,
        };
      });

      const childIds = existingAssetTypeVersion.children?.map((child) => {
        return {
          id: child.childId,
          assetRelationType: child.assetRelationType,
        };
      });
      const relatedAssets = [...(parentIds || []), ...(childIds || [])];

      if (relatedAssetIds && relatedAssetIds.length > 0) {
        for (const assetVersionId of relatedAssetIds) {
          const existingAsset = await this.assetVersionRepository.findOne({
            where: { id: assetVersionId },
            relations: { asset: { assetType: true } },
          });

          if (!existingAsset) {
            errors.push({
              step: 'Related Assets Validation',
              message: 'Property "relatedAssetIds" not found',
            });
            return { errors };
          }

          if (
            relatedAssets.findIndex(
              (element) => element.id === existingAsset.assetTypeVersionId,
            ) === -1
          ) {
            errors.push({
              step: 'Asset Assignment',
              message: `This asset cannot be assigned - asset name: ${existingAsset.asset?.name} asset Type: ${existingAsset.asset?.assetType?.name}`,
            });
            return { errors };
          }

          relation.push({
            childId: existingAsset.id,
            assetRelationTypeId: existingAsset.assetTypeVersionId,
          });
          children.push(existingAsset);
        }
      }

      let tags: Tag[] = [];
      if (tagIds?.length) {
        tags = await this.tagRepository.findAllFiltered({
          where: { id: In(tagIds), isEnabled: true },
          order: { createdAt: 'DESC' },
        });

        if (tags.length !== tagIds.length) {
          const missingTags = tagIds.filter(
            (id) => !tags.some((tag) => tag.id === id),
          );
          errors.push({
            step: 'Tag Validation',
            message: `Tags not found for IDs: ${missingTags.join(', ')}`,
          });
          return { errors };
        }
      }

      const refId = `${existingAssetTypeVersion.assetType?.code}-${uuidv4()}`;

      if (!existingAssetTypeVersion?.assetType?.name) {
        errors.push({
          step: 'Content Validation',
          message:
            'Asset type name is missing for the existing asset type version',
        });
        return { errors };
      }

      try {
        await this.validationService.validateExcelAsset(
          existingAssetTypeVersion.assetType.name,
          JSON.parse(existingAssetTypeVersion.content),
          content,
        );
      } catch (err) {
        errors.push({ step: 'Content Validation', message: err.message });
        return { errors };
      }

      let createdAsset: any;

      try {
        createdAsset =
          await this.assetRepository.createAssetWithVersionsFromFile(
            data,
            tags,
            refId,
            accountableId,
            editorId,
            children,
            relatedAssets,
            existingAssetTypeVersion,
            user,
          );
      } catch (error) {
        errors.push({
          step: 'Asset Creation',
          message: `Error during creating asset: ${error.message}`,
        });
        return { errors };
      }

      return { asset: createdAsset };
    } catch (err) {
      errors.push({ step: 'General Error', message: err.message });
      return { errors };
    }
  }

  //------------------------------
  async findOne(data: FindOneOptions<Asset>) {
    return await this.assetRepository.findOne({
      ...data,
      relations: {
        assetVersions: true,
        assetType: {
          assetCategory: true,
          assetTypeVersions: true,
        },
        tags: true,
      },
    });
  }

  //------------------------------
  async findOneAsset(data: FindOneOptions<AssetVersion>) {
    const assetVersion = (await this.assetVersionRepository.findOne({
      ...data,
      relations: {
        asset: {
          assetType: {
            assetCategory: true,
          },
          tags: true,
        },
        assetTypeVersion: true,
        location: { locationType: true },
      },
    })) as (AssetVersion & { accountable: any; editor: any }) | null;

    if (!assetVersion) {
      throw new BadRequestException({
        message: this.i18nService.t('messages.ERROR_ASSET_NOT_FOUND'),
      });
    }

    if (assetVersion.accountableId) {
      const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
        'IDP_SERVICE_INTERNAL_TOKEN',
        'share',
      );

      const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');
      const { data } = await axios.get(
        `${IDP_SERVICE_URL}/idp/api/v1/users/${assetVersion.accountableId}`,
        {
          headers: {
            'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
          },
        },
      );
      assetVersion.accountable = data.data;
    }

    if (assetVersion.editorId) {
      const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
        'IDP_SERVICE_INTERNAL_TOKEN',
        'share',
      );

      const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');
      const { data } = await axios.get(
        `${IDP_SERVICE_URL}/idp/api/v1/users/${assetVersion.editorId}`,
        {
          headers: {
            'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
          },
        },
      );
      assetVersion.editor = data.data;
    }

    if (assetVersion.updateUserId) {
      await userMapperSingular<AssetVersion>(
        assetVersion,
        'updateUserId',
        'updateUser',
      );
    }

    return assetVersion;
  }

  //------------------------------
  async getAssetRelations(assetVersionId: string) {
    const result =
      await this.assetVersionRepository.getAssetRelations(assetVersionId);

    return {
      assetVersion: result.assetVersion,
      relations: result.relations,
    };
  }

  //------------------------------
  async findOneWithFilter(referenceId: string, baseline: string) {
    return await this.assetVersionRepository.findOne({
      where: {
        asset: { referenceId },
        baseline,
      },
      relations: {
        asset: {
          assetType: {
            assetCategory: true,
          },
          tags: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<Asset>,
    updateAsset: UpdateAssetDto,
    user: IDPUser,
    userRoles: Role[],
    req: Request,
  ): Promise<AssetVersion> {
    return this.assetRepository.updateTransaction(
      data,
      updateAsset,
      user,
      userRoles,
      req,
    );
  }

  //------------------------------
  async remove(
    data: FindOptionsWhere<Asset>,
    user: User,
    userRoles: Role[],
    req: Request,
  ) {
    let deletedAsset = null;
    let logStatus: ActionLogStatusEnum = ActionLogStatusEnum.FAILED;

    const clientIp = requestIp.getClientIp(req as any);
    const assetId = typeof data.id === 'string' ? data.id : undefined;

    if (!assetId) {
      throw new BadRequestException('Asset id is required for update');
    }

    try {
      deletedAsset = await this.assetRepository.findAndDelete(data);

      const versionsToRemove = await this.assetVersionRepository.findAll({
        where: { assetId: data.id },
      });

      if (versionsToRemove.length > 0) {
        const removeVersionIds = versionsToRemove.map((v) => v.id);
        await this.assetVersionRepository.deleteMany(removeVersionIds);
      }

      logStatus = ActionLogStatusEnum.SUCCESS;
      return deletedAsset;
    } catch (error) {
      logStatus = ActionLogStatusEnum.FAILED;
      throw error;
    } finally {
      await this.actionLogRepository.save({
        userId: user.id,
        ipAddress: clientIp,
        roleIds: userRoles.map((r) => r.id),
        action: UserActionEnum.DELETE_ASSET,
        status: logStatus,
        assetId,
      });
    }
  }

  //------------------------------
  async currentUserAssets(user: User, assetTypeId: string) {
    return await this.assetRepository.currentUserAssets(user, assetTypeId);
  }

  //------------------------------
  async findAllPagination(query: FindAllAssetQueryDto) {
    const decodedFilter: string[] | undefined = query.filters
      ? JSON.parse(decodeURIComponent(query.filters))
      : undefined;

    const tagsFilter: string[] | undefined = query.tags
      ? decodeURIComponent(query.tags).split(',')
      : undefined;

    const qb = await this.assetVersionRepository.findAllPaginationWithFilter(
      decodedFilter,
      tagsFilter,
      query,
    );

    return { data: qb[0], count: qb[1] };
  }

  //------------------------------
  async findAllLogSources(query: FindAllAssetQueryDto) {
    const decodedFilter: string[] | undefined = query.filters
      ? JSON.parse(decodeURIComponent(query.filters))
      : undefined;

    const tagsFilter: string[] | undefined = query.tags
      ? decodeURIComponent(query.tags).split(',')
      : undefined;

    const assetTypeVersion = await this.assetTypeVersionRepository.findOne({
      where: {
        archived: false,
        classification: AssetTypeClassificationEnum.LogSource,
      },
    });

    if (!assetTypeVersion) {
      throw new InternalServerErrorException('log source does not exist');
    }

    const qb = await this.assetVersionRepository.findAllPaginationWithFilter(
      decodedFilter,
      tagsFilter,
      { ...query, assetTypeVersionId: assetTypeVersion.id },
    );

    return { data: qb[0], count: qb[1] };
  }

  //------------------------------
  rangeCreator(
    elasticQuery: Record<string, any>[],
    key0: string,
    key: string,
    rangeKey: string,
    element2: string | searchBody,
  ) {
    const existsIndex = elasticQuery.findIndex(
      (arr) => arr.range && arr.range[key0 + key],
    );

    if (existsIndex > -1) {
      if (elasticQuery[existsIndex]['range'][key0 + key]) {
        elasticQuery[existsIndex]['range'][key0 + key] = {
          ...elasticQuery[existsIndex]['range'][key0 + key],
          [rangeKey]: element2,
        };
      } else {
        elasticQuery[existsIndex]['range'][key0 + key] = {
          [rangeKey]: element2,
        };
      }
    } else {
      elasticQuery.push({
        range: { [key0 + key]: { [rangeKey]: element2 } },
      });
    }
  }

  //------------------------------
  recursivelyFlatKeysOfSearch(
    body: searchBody,
    key0: string,
    elasticQuery: Record<string, any>[],
  ) {
    for (const key in body) {
      if (key === 'filters' || key === 'tags') {
        continue;
      }
      const element = body[key];
      if (element) {
        if (!element) {
          continue;
        }
        if (typeof element === 'string') {
          if (key0 + key === 'externalRefId') {
            elasticQuery.push({
              match_phrase: { [key0 + key]: element.toLowerCase() },
            });
          } else {
            elasticQuery.push({
              match: { [key0 + key]: element.toLowerCase() },
            });
          }
        } else if (Array.isArray(element)) {
          const filteredElement = element.filter((item) => item != null);
          if (filteredElement.length === 0) {
            continue;
          }
          elasticQuery.push({
            terms: {
              [key0 + key]: filteredElement.map((data) => data?.toLowerCase()),
            },
          });
        } else if (typeof element === 'number') {
          elasticQuery.push({
            match_phrase: { [key0 + key]: element },
          });
        } else {
          let isRange = false;
          for (const key2 in element) {
            const element2 = element[key2];
            if (!element2) {
              continue;
            }
            if (key2 === 'gte') {
              isRange = true;
              this.rangeCreator(elasticQuery, key0, key, 'gte', element2);
            } else if (key2 === 'lte') {
              isRange = true;
              this.rangeCreator(elasticQuery, key0, key, 'lte', element2);
            } else if (key2 === 'lt') {
              isRange = true;
              this.rangeCreator(elasticQuery, key0, key, 'lt', element2);
            } else if (key2 === 'gt') {
              isRange = true;
              this.rangeCreator(elasticQuery, key0, key, 'gt', element2);
            }
          }
          if (!isRange) {
            this.recursivelyFlatKeysOfSearch(element, key + '.', elasticQuery);
          }
        }
      }
    }
  }

  //------------------------------
  async getElasticSearchIds(
    elasticQuery: Record<string, any>[],
    elasticsearchPage: number,
    elasticsearchSize: number,
    ids: string[],
    assetTypeVersionId: string,
  ) {
    try {
      const data = await ElasticsearchClient.instance.client.search({
        index: assetTypeVersionId,
        from: (elasticsearchPage - 1) * elasticsearchSize,
        size: elasticsearchSize,
        _source: ['_id'],
        query: {
          bool: {
            must: elasticQuery,
          },
        },
      });

      for (let i = 0; i < data.hits.hits.length; i++) {
        const element = data.hits.hits[i];
        if (element._id) {
          ids.push(element._id);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  //------------------------------
  async searchUserScope(
    user: User | any,
    userRoles: Role[],
    query: findAllAssetReportQueryDto,
    body: searchBodyTag,
  ) {
    const hasAdministratorRole = userRoles.some(
      (r) => r.name === AssetRoles.AssetAdministrator,
    );

    let scopeEmployeeIds: string[] = [];
    let assetUserScopeIds: string[] = [];
    let hasSupervisor = false;
    let shouldApplyUserScope = false;

    if (!hasAdministratorRole) {
      hasSupervisor = userRoles.some(
        (role) => role.name === AssetRoles.AssetSupervisor,
      );

      if (hasSupervisor) {
        scopeEmployeeIds = await this.buildSupervisorScope(user.username);
      }

      const hasAuditor = userRoles.some(
        (role) => role.name === AssetRoles.AssetAuditor,
      );
      const hasAssetUser = userRoles.some(
        (role) => role.name === AssetRoles.AssetUser,
      );

      const hasFullAccess = hasSupervisor || hasAuditor;
      shouldApplyUserScope = hasAssetUser && !hasFullAccess;

      if (shouldApplyUserScope) {
        assetUserScopeIds = await this.buildAssetUserScope(user.username);
      }
    }

    const elasticQuery: Record<string, any>[] = [{ term: { archived: false } }];
    const {
      tags,
      filters,
      assetTypeId,
      assetTypeVersionId,
      assetCategoryId,
      locationTypeId,
      locationId,
      ...elasticBody
    } = body;
    delete elasticBody.editorId;
    delete elasticBody.editorUnitId;
    delete elasticBody.accountableId;
    delete elasticBody.accountableUnitId;

    let { editorId, accountableId } = body;

    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    try {
      if (accountableId) {
        const { data: accountableResponse } = await axios.post(
          `${IDP_SERVICE_URL}/idp/api/v1/users`,
          {
            domain: 'iranet',
            employeeId: accountableId,
          },
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );
        await this.usersRepository.save(accountableResponse.data);
        accountableId = accountableResponse.data.id;
      }
      if (editorId) {
        const { data: editorResponse } = await axios.post(
          `${IDP_SERVICE_URL}/idp/api/v1/users`,
          {
            domain: 'iranet',
            employeeId: editorId,
          },
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );
        await this.usersRepository.save(editorResponse.data);
        editorId = editorResponse.data.id;
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    let hasElasticSearch = false;

    for (const key in elasticBody) {
      if (elasticBody[key]) {
        hasElasticSearch = true;
      }
    }

    let ids: string[] | undefined = undefined;

    let elasticsearchPage = 1;
    const elasticsearchSize = 10000;
    if (query.take > elasticsearchSize) {
      query.take = elasticsearchSize;
    }

    const dataToReturn: AssetVersion[] = [];
    if (hasElasticSearch) {
      this.recursivelyFlatKeysOfSearch(elasticBody, '', elasticQuery);
    }
    while (true) {
      if (elasticQuery.length !== 1 && typeof assetTypeVersionId === 'string') {
        ids = [];
        await this.getElasticSearchIds(
          elasticQuery,
          elasticsearchPage,
          elasticsearchSize,
          ids,
          assetTypeVersionId,
        );
        elasticsearchPage++;
      }

      const decodedFilter: string[] | undefined =
        filters && typeof filters === 'string'
          ? JSON.parse(decodeURIComponent(filters))
          : undefined;

      let qb: [AssetVersion[], number] = [[], 0];

      const queryOptions: FindAllAssetQueryDto = {
        ...query,
        externalRefId: undefined,
        accountableId:
          typeof accountableId === 'string' ? accountableId : undefined,
        editorId: typeof editorId === 'string' ? editorId : undefined,
        assetCategoryId:
          typeof assetCategoryId === 'string' ? assetCategoryId : undefined,
        locationTypeId:
          typeof locationTypeId === 'string' ? locationTypeId : undefined,
        locationId: typeof locationId === 'string' ? locationId : undefined,
        assetTypeVersionId:
          typeof assetTypeVersionId === 'string'
            ? assetTypeVersionId
            : undefined,
        assetTypeId: typeof assetTypeId === 'string' ? assetTypeId : undefined,
        ...(shouldApplyUserScope && { assetUserScopeIds }),
        ...(hasSupervisor && { supervisorEmployeeIds: scopeEmployeeIds }),
      };

      if (ids === undefined || ids.length > 0) {
        qb = await this.assetVersionRepository.findAllPaginationWithFilter(
          decodedFilter,
          tags,
          queryOptions,
          ids,
        );
      }

      const assetMap = new Map(qb[0].map((asset) => [asset.id, asset]));
      const orderedAssets = ids
        ? ids.map((id) => assetMap.get(id)).filter(Boolean)
        : qb[0];

      dataToReturn.push(
        ...orderedAssets.filter(function (element) {
          return element !== undefined;
        }),
      );

      if (
        !hasElasticSearch ||
        qb[1] >= query.take ||
        (ids?.length || 0) < elasticsearchSize
      ) {
        return { data: dataToReturn, count: qb[1] };
      }
    }
  }

  //------------------------------
  async flattenAssetContent(
    content: unknown,
    data: Record<string, unknown>,
    key0?: string,
  ) {
    if (!content || typeof content !== 'object') {
      return;
    }
    for (const [key, value] of Object.entries(content)) {
      if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        value !== null
      ) {
        this.flattenAssetContent(value, data, key);
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          continue;
        }
        if (typeof value[0] === 'string') {
          data[key0 ? `${key0}.${key}` : key] = value.join(';');
          return;
        } else {
          const object: Record<string, string[]> = {};
          for (let i = 0; i < value.length; i++) {
            const element = value[i];
            for (const [key1, value1] of Object.entries(element)) {
              if (!object[key1]) {
                object[key1] = [];
              }
              object[key1].push(value1 as any);
            }
          }

          for (const [key1, value1] of Object.entries(object)) {
            data[key0 ? `${key0}.${key}.${key1}` : `${key}.${key1}`] =
              value1.join(', ');
          }
        }
      } else {
        data[key0 ? `${key0}.${key}` : key] = value;
      }
    }
  }

  //------------------------------
  transformAssetToReport(assetVersion: AssetVersion) {
    const content = safeJsonParse(assetVersion.content);
    const data: Record<string, unknown> = {};

    const relations = [
      ...(assetVersion.children || []),
      ...(assetVersion.parents || []),
    ];

    const relatedAssets: AssetVersion[] = [];
    for (let i = 0; i < relations.length; i++) {
      const element = relations[i];

      if (
        element.child &&
        element.child.id === assetVersion.id &&
        element.parent
      ) {
        relatedAssets.push(element.parent);
      } else if (
        element.parent &&
        element.parent.id === assetVersion.id &&
        element.child
      ) {
        relatedAssets.push(element.child);
      }
    }

    const relationsUniqueBy = [
      ...new Map(relatedAssets.map((item) => [item['id'], item])).values(),
    ];

    const accountable: any = assetVersion.accountable;
    const responsible: any = assetVersion.editor;

    data.name = assetVersion.asset?.name;
    data.externalRefId = assetVersion.asset?.externalRefId;
    data.version = assetVersion.version;
    data.location = assetVersion.location?.name;
    data.location_address = assetVersion.location?.address;
    data.accountableDeputy = accountable?.VicePresidentName || '';
    data.accountableManagement = accountable?.ManagementName || '';
    data.accountableGroup = accountable?.GroupName || '';
    data.accountableName =
      (accountable?.FirstName || '') + ' ' + (accountable?.LastName || '');

    data.responsibleDeputy = responsible?.VicePresidentName || '';
    data.responsibleManagement = responsible?.ManagementName || '';
    data.responsibleGroup = responsible?.GroupName || '';
    data.responsibleName =
      (responsible?.FirstName || '') + ' ' + (responsible?.LastName || '');

    this.flattenAssetContent(content, data);

    for (let i = 0; i < relationsUniqueBy.length; i++) {
      const element = relationsUniqueBy[i];

      data[`relation_${element.asset?.assetType?.name}`] = data[
        `relation_${element.asset?.assetType?.name}`
      ]
        ? data[`relation_${element.asset?.assetType?.name}`] +
          ';' +
          element.asset?.name +
          '{v:' +
          element.version +
          '}'
        : element.asset?.name + '{v:' + element.version + '}';
    }
    return data;
  }

  //------------------------------
  async reportUserScopeFile(
    user: User,
    userRoles: Role[],
    body: assetSearchBodyReportExportExcelDto,
    res: Response,
    type: 'csv' | 'xls' | 'pdf',
  ) {
    const elasticQuery: Record<string, any>[] = [{ term: { archived: false } }];
    const {
      tags,
      filters,
      assetTypeId,
      locationTypeId,
      locationId,
      externalRefId,
      name,
      ...elasticBody
    } = body;
    delete elasticBody.editorId;
    delete elasticBody.editorUnitId;
    delete elasticBody.accountableId;
    delete elasticBody.accountableUnitId;
    delete elasticBody.assetTypeVersionId;

    let { editorId, accountableId, assetTypeVersionId } = body;

    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    const assetType = await this.assetTypeRepository.findOne({
      where: { id: assetTypeId },
      relations: { assetTypeVersions: true },
      order: { assetTypeVersions: { version: 'ASC' } },
    });

    if (!assetType) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: {
            property: 'assetType',
          },
        }),
      );
    }

    if (!assetTypeVersionId || type === 'xls') {
      if (!assetType.assetTypeVersions) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: {
              property: 'assetTypeVersions',
            },
          }),
        );
      }
      assetTypeVersionId = assetType.assetTypeVersions[0].id;
    }

    let version = 1;

    try {
      if (accountableId) {
        const { data: accountableResponse } = await axios.post(
          `${IDP_SERVICE_URL}/idp/api/v1/users`,
          {
            domain: 'iranet',
            employeeId: accountableId,
          },
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );
        await this.usersRepository.save(accountableResponse.data);
        accountableId = accountableResponse.data.id;
      }
      if (editorId) {
        const { data: editorResponse } = await axios.post(
          `${IDP_SERVICE_URL}/idp/api/v1/users`,
          {
            domain: 'iranet',
            employeeId: editorId,
          },
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );
        await this.usersRepository.save(editorResponse.data);
        editorId = editorResponse.data.id;
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    let hasElasticSearch = false;

    for (const key in elasticBody) {
      if (elasticBody[key]) {
        hasElasticSearch = true;
      }
    }

    let ids: string[] | undefined = undefined;

    let elasticsearchPage = 1;
    let sqlPage = 1;
    const elasticsearchSize = 10000;

    let stream: CsvFormatterStream<Row, Row> | undefined = undefined;
    let worksheet: ExcelJS.Worksheet | undefined = undefined;
    let worksheetInfo: ExcelJS.Worksheet | undefined = undefined;
    let workbook: ExcelJS.stream.xlsx.WorkbookWriter | undefined = undefined;
    if (type === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      const date = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Disposition', `attachment; filename="asset-reports-${date}.csv"`);
    } else if (type === 'xls') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      const date = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Disposition', `attachment; filename="asset-reports-${date}.xlsx"`);

      workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
      worksheetInfo = workbook.addWorksheet('Info');
      worksheet = workbook.addWorksheet('V1');

      worksheetInfo.getColumn('A').width = 20;
      worksheetInfo.getColumn('B').width = 50;
      worksheetInfo.getRow(1).height = 30;
    }

    let csvHeadersSet = false;
    if (hasElasticSearch) {
      this.recursivelyFlatKeysOfSearch(elasticBody, '', elasticQuery);
    }

    const users: any = {};
    while (true) {
      if (elasticQuery.length !== 1) {
        ids = [];

        await this.getElasticSearchIds(
          elasticQuery,
          elasticsearchPage,
          elasticsearchSize,
          ids,
          assetTypeVersionId,
        );
        elasticsearchPage++;
      }

      const decodedFilter: string[] | undefined =
        filters && typeof filters === 'string'
          ? JSON.parse(decodeURIComponent(filters))
          : undefined;

      let qb: [AssetVersion[], number] = [[], 0];

      const queryOptions: FindAllAssetQueryDto = {
        name: typeof name === 'string' ? name : undefined,
        accountableId:
          typeof accountableId === 'string' ? accountableId : undefined,
        editorId: typeof editorId === 'string' ? editorId : undefined,
        externalRefId:
          typeof externalRefId === 'string' ? externalRefId : undefined,
        locationTypeId:
          typeof locationTypeId === 'string' ? locationTypeId : undefined,
        locationId: typeof locationId === 'string' ? locationId : undefined,
        assetTypeVersionId:
          typeof assetTypeVersionId === 'string'
            ? assetTypeVersionId
            : undefined,
        assetTypeId: typeof assetTypeId === 'string' ? assetTypeId : undefined,
        take: 10000,
        skip: 10000 * (sqlPage - 1),
      };
      sqlPage++;

      if (ids === undefined || ids.length > 0) {
        qb =
          await this.assetVersionRepository.findAllPaginationWithFilterForReport(
            decodedFilter,
            tags,
            queryOptions,
            ids,
          );
      }

      const assetMap = new Map(qb[0].map((asset) => [asset.id, asset]));
      const orderedAssets = ids
        ? ids.map((id) => assetMap.get(id)).filter(Boolean)
        : qb[0];

      for (let i = 0; i < orderedAssets.length; i++) {
        const element = orderedAssets[i];
        if (!element) {
          continue;
        }
        if (element.accountableId) {
          if (users[element.accountableId]) {
            (element as any).accountable = users[element.accountableId];
          } else {
            try {
              const { data: accountableResponse } = await axios.get(
                `${IDP_SERVICE_URL}/idp/api/v1/auth/get-one-employee-internal?id=${element.accountableId}`,
                {
                  headers: {
                    'x-internal-communication-token':
                      IDP_SERVICE_INTERNAL_TOKEN,
                  },
                },
              );
              users[element.accountableId] = accountableResponse.data;
              (element as any).accountable = accountableResponse.data;
            } catch (error) {
              console.log(error);
            }
          }
        }
        if (element.editorId) {
          if (users[element.editorId]) {
            (element as any).editor = users[element.editorId];
          } else {
            try {
              const { data: responsibleResponse } = await axios.get(
                `${IDP_SERVICE_URL}/idp/api/v1/auth/get-one-employee-internal?id=${element.editorId}`,
                {
                  headers: {
                    'x-internal-communication-token':
                      IDP_SERVICE_INTERNAL_TOKEN,
                  },
                },
              );
              users[element.editorId] = responsibleResponse.data;
              (element as any).editor = responsibleResponse.data;
            } catch (error) {
              console.log(error);
            }
          }
        }
      }

      const mappedData = orderedAssets.map((data) =>
        data ? this.transformAssetToReport(data) : undefined,
      );
      const columns: { header: string; key: string }[] = [];
      const columnsArray: string[] = [];

      const tableHeaderStyle = {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' },
        },
        alignment: { vertical: 'middle', horizontal: 'center' },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        },
      };

      const dataCellStyle = {
        alignment: { vertical: 'middle', horizontal: 'left' },
        border: {
          top: { style: 'thin', color: { argb: 'D0D0D0' } },
          left: { style: 'thin', color: { argb: 'D0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
          right: { style: 'thin', color: { argb: 'D0D0D0' } },
        },
      };

      const headerLabelStyle = {
        font: { bold: true, size: 11 },
        alignment: { vertical: 'middle', horizontal: 'left' },
        border: {
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
        },
      };

      const headerValueStyle = {
        alignment: { vertical: 'middle', horizontal: 'left' },
        border: {
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
        },
      };

      for (let i = 0; i < mappedData.length; i++) {
        const element = mappedData[i];
        if (element !== undefined) {
          if (type === 'csv') {
            if (csvHeadersSet) {
              stream!.write(element); // row is a plain object
            } else {
              for (const [key] of Object.entries(element)) {
                columnsArray.push(key);
              }
            }
          } else if (type === 'xls') {
            if (worksheet) {
              for (const [key] of Object.entries(element)) {
                columns.push({ header: key, key: key });
              }
              worksheet.columns = [
                ...new Map(columns.map((item) => [item.key, item])).values(),
              ];
              if (i === 0) {
                worksheet.getRow(1).eachCell((cell: any) => {
                  cell.style = tableHeaderStyle;
                });
              }
              const newRow = worksheet.addRow(element);
              if (i % 2 === 0) {
                newRow.eachCell((cell: any) => {
                  cell.style = {
                    ...dataCellStyle,
                    fill: {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: 'F5F5F5' },
                    },
                  };
                });
              }
            }
          }
        }
      }

      if (
        (!hasElasticSearch && qb[0].length < 10000) ||
        (hasElasticSearch && (ids?.length || 0) < elasticsearchSize)
      ) {
        if (type === 'csv') {
          if (!csvHeadersSet) {
            stream = format({
              headers: [...new Set(columnsArray)],
            });
            stream.pipe(res);
            sqlPage = 1;
            csvHeadersSet = true;
          } else {
            stream!.end();
            return;
          }
        } else if (type === 'xls' && workbook && worksheetInfo && worksheet) {
          if (!assetType.assetTypeVersions) {
            throw new BadRequestException(
              this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
                args: {
                  property: 'assetTypeVersions',
                },
              }),
            );
          }
          if (assetType.assetTypeVersions[version]) {
            assetTypeVersionId = assetType.assetTypeVersions[version].id;

            if (version !== assetType.assetTypeVersions?.length) {
              version++;
              worksheet = workbook.addWorksheet(`V${version}`);
              // Apply header styling to new worksheet
              worksheet.columns = worksheet.columns.map((column: any) => ({
                ...column,
                width: 20,
              }));
              elasticsearchPage = 1;
              sqlPage = 1;
              continue;
            }
          }

          const infoTitleStyle = {
        font: { bold: true, size: 16, color: { argb: 'FFFFFF' } },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '2F5496' },
        },
        alignment: { vertical: 'middle', horizontal: 'center' },
      };

      worksheetInfo.getCell('A1').value = {
        richText: [
          {
            font: { italic: true, size: 18, bold: true },
            text: assetType?.name || '',
          },
        ],
      };
      worksheetInfo.getCell('A1').style = infoTitleStyle;

      let row = 2;
          if (assetTypeVersionId) {
            const assetTypeVersion =
              await this.assetTypeVersionRepository.findOne({
                where: { id: assetTypeVersionId },
              });

            worksheetInfo.getCell('A' + row).value = {
              richText: [{ text: 'version' }],
            };
            worksheetInfo.getCell('A' + row).style = headerLabelStyle;

            worksheetInfo.getCell('B' + row).value = {
              richText: [{ text: assetTypeVersion?.version.toString() || '' }],
            };
            worksheetInfo.getCell('B' + row).style = headerValueStyle;
            row++;
          }
          if (name) {
            worksheetInfo.getCell('A' + row).value = {
              richText: [{ text: 'name' }],
            };
            worksheetInfo.getCell('A' + row).style = headerLabelStyle;
            worksheetInfo.getCell('B' + row).value = {
              richText: [{ text: name }],
            };
            worksheetInfo.getCell('B' + row).style = headerValueStyle;
            row++;
          }
          if (externalRefId) {
            worksheetInfo.getCell('A' + row).value = {
              richText: [{ text: 'externalRefId' }],
            };
            worksheetInfo.getCell('A' + row).style = headerLabelStyle;
            worksheetInfo.getCell('B' + row).value = {
              richText: [{ text: externalRefId }],
            };
            worksheetInfo.getCell('B' + row).style = headerValueStyle;
            row++;
          }
          if (locationTypeId) {
            const locationType = await this.locationTypeRepository.findOne({
              where: { id: locationTypeId },
            });
            if (locationType) {
              worksheetInfo.getCell('A' + row).value = {
                richText: [{ text: 'locationType' }],
              };
              worksheetInfo.getCell('A' + row).style = headerLabelStyle;
              worksheetInfo.getCell('B' + row).value = {
                richText: [{ text: locationType.name }],
              };
              worksheetInfo.getCell('B' + row).style = headerValueStyle;
              row++;
            }
          }
          if (locationId) {
            const location = await this.locationRepository.findOne({
              where: { id: locationId },
            });
            if (location) {
              worksheetInfo.getCell('A' + row).value = {
                richText: [{ text: 'location' }],
              };
              worksheetInfo.getCell('A' + row).style = headerLabelStyle;
              worksheetInfo.getCell('B' + row).value = {
                richText: [{ text: location.name }],
              };
              worksheetInfo.getCell('B' + row).style = headerValueStyle;
              row++;
            }
          }

          if (elasticQuery.length !== 1) {
            for (let i = 0; i < elasticQuery.length; i++) {
              const element = elasticQuery[i];
              if (element.terms) {
                for (const [key, value] of Object.entries(element.terms)) {
                  worksheetInfo.getCell('A' + row).value = {
                    richText: [{ text: key }],
                  };
                  worksheetInfo.getCell('A' + row).style = headerLabelStyle;
                  worksheetInfo.getCell('B' + row).value = {
                    richText: [
                      {
                        text: Array.isArray(value)
                          ? value.join(', ')
                          : (value as string),
                      },
                    ],
                  };
                  worksheetInfo.getCell('B' + row).style = headerValueStyle;
                  row++;
                }
              }
              if (element.match_phrase) {
                for (const [key, value] of Object.entries(
                  element.match_phrase,
                )) {
                  worksheetInfo.getCell('A' + row).value = {
                    richText: [{ text: key }],
                  };
                  worksheetInfo.getCell('A' + row).style = headerLabelStyle;
                  worksheetInfo.getCell('B' + row).value = {
                    richText: [
                      {
                        text: Array.isArray(value)
                          ? value.join(', ')
                          : (value as string),
                      },
                    ],
                  };
                  worksheetInfo.getCell('B' + row).style = headerValueStyle;
                  row++;
                }
              }
              if (element.match) {
                for (const [key, value] of Object.entries(element.match)) {
                  worksheetInfo.getCell('A' + row).value = {
                    richText: [{ text: key }],
                  };
                  worksheetInfo.getCell('A' + row).style = headerLabelStyle;
                  worksheetInfo.getCell('B' + row).value = {
                    richText: [
                      {
                        text: Array.isArray(value)
                          ? value.join(', ')
                          : (value as string),
                      },
                    ],
                  };
                  worksheetInfo.getCell('B' + row).style = headerValueStyle;
                  row++;
                }
              }
              if (element.range) {
                for (const [key, value] of Object.entries(element.range)) {
                  worksheetInfo.getCell('A' + row).value = {
                    richText: [{ text: key }],
                  };
                  worksheetInfo.getCell('A' + row).style = headerLabelStyle;
                  worksheetInfo.getCell('B' + row).value = {
                    richText: [
                      {
                        text: Array.isArray(value)
                          ? value.join(', ')
                          : (value as string),
                      },
                    ],
                  };
                  worksheetInfo.getCell('B' + row).style = headerValueStyle;
                  row++;
                }
              }
            }
          }

          worksheetInfo.columns.forEach((column) => {
            const lengths = column.values?.map((v: any) => v?.toString().length);
            if (lengths) {
              const maxLength = Math.max(
                ...lengths.filter((v: number) => typeof v === 'number'),
              );
              column.width = Math.min(maxLength + 2, 50);
            }
          });

          // Merge cells for title - extend to cover all label-value pairs
          worksheetInfo.mergeCells(`A1:B${row}`);

          // Style the Info sheet label column (column A)
          worksheetInfo.getColumn('A').eachCell((cell: any) => {
            if (cell.row > 1) {
              cell.style = headerLabelStyle;
            }
          });

          // Style the Info sheet value column (column B)
          worksheetInfo.getColumn('B').eachCell((cell: any) => {
            if (cell.row > 1) {
              cell.style = headerValueStyle;
            }
          });

          worksheetInfo.commit();
          worksheet.commit();
          await workbook.commit();
          return;
        } else {
          return;
        }
      }
    }
  }

  //------------------------------
  async getReportJson(body: assetBodyReportJsonDto, query: PaginationDto) {
    const {
      tags,
      filters,
      assetTypeId,
      locationTypeId,
      locationId,
      externalRefId,
      name,
    } = body;

    let { editorId, accountableId } = body;

    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    try {
      if (accountableId) {
        const { data: accountableResponse } = await axios.post(
          `${IDP_SERVICE_URL}/idp/api/v1/users`,
          {
            domain: 'iranet',
            employeeId: accountableId,
          },
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );
        await this.usersRepository.save(accountableResponse.data);
        accountableId = accountableResponse.data.id;
      }
      if (editorId) {
        const { data: editorResponse } = await axios.post(
          `${IDP_SERVICE_URL}/idp/api/v1/users`,
          {
            domain: 'iranet',
            employeeId: editorId,
          },
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );
        await this.usersRepository.save(editorResponse.data);
        editorId = editorResponse.data.id;
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    const users: any = {};
    const decodedFilter: string[] | undefined =
      filters && typeof filters === 'string'
        ? JSON.parse(decodeURIComponent(filters))
        : undefined;

    let qb: [AssetVersion[], number] = [[], 0];

    const queryOptions: FindAllAssetQueryDto = {
      name: typeof name === 'string' ? name : undefined,
      accountableId:
        typeof accountableId === 'string' ? accountableId : undefined,
      editorId: typeof editorId === 'string' ? editorId : undefined,
      externalRefId:
        typeof externalRefId === 'string' ? externalRefId : undefined,
      locationTypeId:
        typeof locationTypeId === 'string' ? locationTypeId : undefined,
      locationId: typeof locationId === 'string' ? locationId : undefined,
      assetTypeId: typeof assetTypeId === 'string' ? assetTypeId : undefined,
      take: query.take,
      skip: query.skip,
    };

    qb = await this.assetVersionRepository.findAllPaginationWithFilterForReport(
      decodedFilter,
      tags,
      queryOptions,
    );

    for (let i = 0; i < qb[0].length; i++) {
      const element = qb[0][i];
      if (!element) {
        continue;
      }
      if (element.accountableId) {
        if (users[element.accountableId]) {
          (element as any).accountable = users[element.accountableId];
        } else {
          try {
            const { data: accountableResponse } = await axios.get(
              `${IDP_SERVICE_URL}/idp/api/v1/auth/get-one-employee-internal?id=${element.accountableId}`,
              {
                headers: {
                  'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
                },
              },
            );
            users[element.accountableId] = accountableResponse.data;
            (element as any).accountable = accountableResponse.data;
          } catch (error) {
            console.log(error);
          }
        }
      }
      if (element.editorId) {
        if (users[element.editorId]) {
          (element as any).editor = users[element.editorId];
        } else {
          try {
            const { data: responsibleResponse } = await axios.get(
              `${IDP_SERVICE_URL}/idp/api/v1/auth/get-one-employee-internal?id=${element.editorId}`,
              {
                headers: {
                  'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
                },
              },
            );
            users[element.editorId] = responsibleResponse.data;
            (element as any).editor = responsibleResponse.data;
          } catch (error) {
            console.log(error);
          }
        }
      }
    }

    const mappedData = qb[0].map((assetVersion) => {
      if (!assetVersion) {
        return undefined;
      }

      const data: Record<string, unknown> = {};

      const relations = [
        ...(assetVersion.children || []),
        ...(assetVersion.parents || []),
      ];

      const relatedAssets: AssetVersion[] = [];
      for (let i = 0; i < relations.length; i++) {
        const element = relations[i];

        if (
          element.child &&
          element.child.id === assetVersion.id &&
          element.parent
        ) {
          relatedAssets.push(element.parent);
        } else if (
          element.parent &&
          element.parent.id === assetVersion.id &&
          element.child
        ) {
          relatedAssets.push(element.child);
        }
      }

      const relationsUniqueBy = [
        ...new Map(relatedAssets.map((item) => [item['id'], item])).values(),
      ];

      const accountable: any = assetVersion.accountable;
      const responsible: any = assetVersion.editor;

      data.name = assetVersion.asset?.name;
      data.externalRefId = assetVersion.asset?.externalRefId;
      data.version = assetVersion.version;
      data.location = assetVersion.location?.name;
      data.location_address = assetVersion.location?.address;
      data.accountableDeputy = accountable?.VicePresidentName || '';
      data.accountableManagement = accountable?.ManagementName || '';
      data.accountableGroup = accountable?.GroupName || '';
      data.accountableName =
        (accountable?.FirstName || '') + ' ' + (accountable?.LastName || '');

      data.responsibleDeputy = responsible?.VicePresidentName || '';
      data.responsibleManagement = responsible?.ManagementName || '';
      data.responsibleGroup = responsible?.GroupName || '';
      data.responsibleName =
        (responsible?.FirstName || '') + ' ' + (responsible?.LastName || '');

      for (let i = 0; i < relationsUniqueBy.length; i++) {
        const element = relationsUniqueBy[i];
        if (data[`relation_${element.asset?.assetType?.name}`]) {
          (data[`relation_${element.asset?.assetType?.name}`] as any).push(
            element.asset?.name + '{v:' + element.version + '}',
          );
        } else {
          data[`relation_${element.asset?.assetType?.name}`] = [
            element.asset?.name + '{v:' + element.version + '}',
          ];
        }
      }

      if (assetVersion.assetTypeVersion?.content) {
        const searchablePaths = getSearchablePaths(
          safeJsonParse(assetVersion.assetTypeVersion.content) as any,
        );

        const searchableContent = getValuesFromJSON(
          safeJsonParse(assetVersion.content),
          searchablePaths,
        );

        for (const t in searchableContent) {
          data[t] = searchableContent[t];
        }
      }
      return data;
    });

    const data: Record<string, unknown>[] = [];

    for (let i = 0; i < mappedData.length; i++) {
      const element = mappedData[i];
      if (element !== undefined) {
        data.push(element);
      }
    }

    return [data, qb[1]];
  }

  //------------------------------
  async reportUserScope(
    user: User,
    userRoles: Role[],
    query: findAllAssetReportQueryDto,
    body: assetSearchBodyReportDto,
  ) {
    const elasticQuery: Record<string, any>[] = [];
    const {
      tags,
      filters,
      assetTypeId,
      assetTypeVersionId,
      assetCategoryId,
      locationTypeId,
      locationId,
      externalRefId,
      name,
      ...elasticBody
    } = body;
    delete elasticBody.editorId;
    delete elasticBody.editorUnitId;
    delete elasticBody.accountableId;
    delete elasticBody.accountableUnitId;

    let { editorId, accountableId } = body;

    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    try {
      if (accountableId) {
        const { data: accountableResponse } = await axios.post(
          `${IDP_SERVICE_URL}/idp/api/v1/users`,
          {
            domain: 'iranet',
            employeeId: accountableId,
          },
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );
        await this.usersRepository.save(accountableResponse.data);
        accountableId = accountableResponse.data.id;
      }
      if (editorId) {
        const { data: editorResponse } = await axios.post(
          `${IDP_SERVICE_URL}/idp/api/v1/users`,
          {
            domain: 'iranet',
            employeeId: editorId,
          },
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );
        await this.usersRepository.save(editorResponse.data);
        editorId = editorResponse.data.id;
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    let hasElasticSearch = false;

    for (const key in elasticBody) {
      if (elasticBody[key]) {
        hasElasticSearch = true;
      }
    }

    let ids: string[] | undefined = undefined;

    let elasticsearchPage = 1;
    const elasticsearchSize = 10000;
    if (query.take > elasticsearchSize) {
      query.take = elasticsearchSize;
    }

    const dataToReturn: Record<string, unknown>[] = [];
    if (hasElasticSearch) {
      this.recursivelyFlatKeysOfSearch(elasticBody, '', elasticQuery);
    }

    const users: any = {};
    while (true) {
      if (elasticQuery.length > 0) {
        ids = [];

        await this.getElasticSearchIds(
          [...elasticQuery, { term: { archived: false } }],
          elasticsearchPage,
          elasticsearchSize,
          ids,
          assetTypeVersionId,
        );
        elasticsearchPage++;
      }

      const decodedFilter: string[] | undefined =
        filters && typeof filters === 'string'
          ? JSON.parse(decodeURIComponent(filters))
          : undefined;

      let qb: [AssetVersion[], number] = [[], 0];

      const queryOptions: FindAllAssetQueryDto = {
        ...query,
        name: typeof name === 'string' ? name : undefined,
        accountableId:
          typeof accountableId === 'string' ? accountableId : undefined,
        editorId: typeof editorId === 'string' ? editorId : undefined,
        externalRefId:
          typeof externalRefId === 'string' ? externalRefId : undefined,
        assetCategoryId:
          typeof assetCategoryId === 'string' ? assetCategoryId : undefined,
        locationTypeId:
          typeof locationTypeId === 'string' ? locationTypeId : undefined,
        locationId: typeof locationId === 'string' ? locationId : undefined,
        assetTypeVersionId:
          typeof assetTypeVersionId === 'string'
            ? assetTypeVersionId
            : undefined,
        assetTypeId: typeof assetTypeId === 'string' ? assetTypeId : undefined,
      };

      if (ids === undefined || ids.length > 0) {
        qb =
          await this.assetVersionRepository.findAllPaginationWithFilterForReport(
            decodedFilter,
            tags,
            queryOptions,
            ids,
          );
      }

      const assetMap = new Map(qb[0].map((asset) => [asset.id, asset]));
      const orderedAssets = ids
        ? ids.map((id) => assetMap.get(id)).filter(Boolean)
        : qb[0];

      for (let i = 0; i < orderedAssets.length; i++) {
        const element = orderedAssets[i];
        if (!element) {
          continue;
        }
        if (element.accountableId) {
          if (users[element.accountableId]) {
            (element as any).accountable = users[element.accountableId];
          } else {
            try {
              const { data: accountableResponse } = await axios.get(
                `${IDP_SERVICE_URL}/idp/api/v1/auth/get-one-employee-internal?id=${element.accountableId}`,
                {
                  headers: {
                    'x-internal-communication-token':
                      IDP_SERVICE_INTERNAL_TOKEN,
                  },
                },
              );
              users[element.accountableId] = accountableResponse.data;
              (element as any).accountable = accountableResponse.data;
            } catch (error) {
              console.log(error);
            }
          }
        }
        if (element.editorId) {
          if (users[element.editorId]) {
            (element as any).editor = users[element.editorId];
          } else {
            try {
              const { data: responsibleResponse } = await axios.get(
                `${IDP_SERVICE_URL}/idp/api/v1/auth/get-one-employee-internal?id=${element.editorId}`,
                {
                  headers: {
                    'x-internal-communication-token':
                      IDP_SERVICE_INTERNAL_TOKEN,
                  },
                },
              );
              users[element.editorId] = responsibleResponse.data;
              (element as any).editor = responsibleResponse.data;
            } catch (error) {
              console.log(error);
            }
          }
        }
      }

      const mappedData = orderedAssets.map((data) =>
        data ? this.transformAssetToReport(data) : undefined,
      );

      dataToReturn.push(
        ...mappedData.filter(function (element) {
          return element !== undefined;
        }),
      );

      if (
        !hasElasticSearch ||
        qb[1] >= query.take ||
        (ids?.length || 0) < elasticsearchSize
      ) {
        return { data: dataToReturn, count: qb[1] };
      }
    }
  }

  //------------------------------
  // async autoComplete(
  //   body: Record<string, Record<string, object | string> | string>,
  // ) {
  //   const elasticQuery: Record<string, any>[] = [{ term: { archived: false } }];
  //   for (const key in body) {
  //     if (key === 'filters' || key === 'tags') {
  //       continue;
  //     }
  //     const element = body[key];
  //     if (element) {
  //       if (typeof element === 'string') {
  //         elasticQuery.push({
  //           wildcard: { [key]: `${element.toLowerCase()}*` },
  //         });
  //       } else {
  //         for (const key2 in element) {
  //           const element2 = element[key2];
  //           if (typeof element2 === 'string') {
  //             elasticQuery.push({
  //               wildcard: { [key + '.' + key2]: `${element2.toLowerCase()}*` },
  //             });
  //           }
  //         }
  //       }
  //     }
  //   }

  //   const data = await ElasticsearchClient.instance.client.search({
  //     index: 'assets',
  //     query: {
  //       bool: {
  //         must: elasticQuery,
  //       },
  //     },
  //     // query: {
  //     //   term: { 'SecurityConfiguration.Firewall': true },
  //     // },
  //   });

  //   return data.hits.hits.map((hit) => hit._source);
  // }

  //------------------------------
  async findAllWithOutPaginate(query: FindAllAssetQueryWithOutPaginateDto) {
    const decodedFilter: string[] | undefined = query.filters
      ? JSON.parse(decodeURIComponent(query.filters))
      : undefined;

    const tagsFilter: string[] | undefined = query.tags
      ? decodeURIComponent(query.tags).split(',')
      : undefined;

    const qb = await this.assetVersionRepository.findAllPaginationWithOutFilter(
      decodedFilter,
      tagsFilter,
      query,
    );

    return { data: qb[0], count: qb[1] };
  }

  //------------------------------
  async getRelatedAssets(assetVersionId: string) {
    const assetVersion = await this.assetVersionRepository.findOne({
      where: { id: assetVersionId },
    });

    if (!assetVersion) {
      throw new BadRequestException({
        message: this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
          args: { value: assetVersionId, property: 'Asset Version' },
        }),
      });
    }

    const parentRelations = await this.assetRelationRepository.findAllFiltered({
      where: { child: { id: assetVersionId } },
      relations: {
        parent: {
          asset: true,
          assetTypeVersion: { assetType: { assetCategory: true } },
        },
      },
      order: { createdAt: 'DESC' },
    });

    const childRelations = await this.assetRelationRepository.findAllFiltered({
      where: { parent: { id: assetVersionId } },
      relations: {
        child: {
          asset: true,
          assetTypeVersion: { assetType: { assetCategory: true } },
        },
      },
      order: { createdAt: 'DESC' },
    });

    const parents = parentRelations.map((relation) => relation.parent);
    const children = childRelations.map((relation) => relation.child);

    const seenIds = new Set<string>();
    const uniqueAssetVersions: AssetVersion[] = [];

    [...parents, ...children].forEach((av) => {
      if (av && !seenIds.has(av.id)) {
        seenIds.add(av.id);
        uniqueAssetVersions.push(av);
      }
    });

    return { relatedAssetVersions: uniqueAssetVersions };
  }

  //------------------------------
  async findAssetVersionsByLocationId(
    locationId: string,
    skip?: number,
    take?: number,
  ) {
    const baseQuery: any = {
      where: {
        locationId,
      },
      relations: {
        asset: true,
        assetTypeVersion: {
          assetType: true,
        },
      },
      select: {
        id: true,
        version: true,
        baseline: true,
        asset: {
          id: true,
          name: true,
          referenceId: true,
          externalRefId: true,
        },
        assetTypeVersion: {
          id: true,
          version: true,
          assetType: {
            code: true,
            name: true,
          },
        },
      },
    };

    const queryOptions = {
      ...baseQuery,
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
    };

    const [data, total] = await Promise.all([
      this.assetVersionRepository.findAll(queryOptions),
      this.assetVersionRepository.count(baseQuery),
    ]);

    return { data, total };
  }

  //------------------------------
  async getAssetArchives(referenceId: string, query: PaginationDto) {
    return await this.assetVersionRepository.findAllPagination(
      query.skip,
      query.take,
      {
        where: { asset: { referenceId } },
        order: { baseline: 'DESC' },
        select: { id: true, baseline: true },
        relations: { asset: true },
      },
    );
  }

  //------------------------------
  async findForGuard(assetVersionId: string) {
    const assetVersion = await this.assetVersionRepository.findOne({
      where: { id: assetVersionId },
    });

    if (!assetVersion) {
      throw new BadRequestException({
        message: this.i18nService.t('messages.ERROR_ASSET_NOT_FOUND'),
      });
    }

    return assetVersion;
  }

  //------------------------------
  async indexAllAssetsToElasticsearch() {
    const assetTypeVersions = await this.assetTypeVersionRepository.findAll();
    console.log(assetTypeVersions);

    for (let i = 0; i < assetTypeVersions.length; i++) {
      const assetTypeVersion = assetTypeVersions[i];
      try {
        await ElasticsearchClient.instance.client.indices.delete({
          index: assetTypeVersion.id,
        });
      } catch (error) {
        console.log(error);
      }
      await ElasticsearchClient.instance.client.indices.create({
        index: assetTypeVersion.id,
      });

      const count = await this.assetVersionRepository.count({
        where: { archived: false, assetTypeVersionId: assetTypeVersion.id },
      });

      for (let i = 0; i < Math.ceil(count / 100); i++) {
        const assets = await this.assetVersionRepository.findAll({
          take: 100,
          skip: 100 * i,
          where: { archived: false, assetTypeVersionId: assetTypeVersion.id },
          order: { createdAt: 'DESC' },
          relations: { asset: true },
        });

        if (assetTypeVersion.id === 'e1a42195-e9ce-4747-85d1-505e5ab142f4') {
          console.log(assets);
        }

        const operations = assets.flatMap((doc) => {
          const { content, ...data } = doc;
          return [
            { index: { _index: assetTypeVersion.id, _id: doc.id } },
            {
              ...JSON.parse(content),
              ...data,
              referenceId: doc.asset?.referenceId,
              externalRefId: doc.asset?.externalRefId,
              name: doc.asset?.name,
              description: doc.asset?.description,
              content: undefined,
              asset: undefined,
            },
          ];
        });

        try {
          const data = await ElasticsearchClient.instance.client.bulk({
            refresh: true,
            operations,
          });

          if (data?.errors) {
            for (let i = 0; i < assets.length; i++) {
              const element = assets[i];
              try {
                await ElasticsearchClient.instance.client.index({
                  index: assetTypeVersion.id,
                  id: element.id,
                  body: {
                    ...JSON.parse(element.content),
                    ...data,
                    referenceId: element.asset?.referenceId,
                    externalRefId: element.asset?.externalRefId,
                    name: element.asset?.name,
                    description: element.asset?.description,
                    content: undefined,
                    asset: undefined,
                  },
                });
                await ElasticsearchClient.instance.client.indices.refresh({
                  index: assetTypeVersion.id,
                });
              } catch (error) {
                console.log(error, element);
              }
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
    }

    return true;
  }

  //------------------------------
  async getSubordinateUsers(user: User | any) {
    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    const { data: userData } = await axios.get(
      `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`,
      {
        params: { ADUserName: `iranet\\${user}`, GetInternalUsers: true },
        headers: {
          'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
          accept: '*/*',
        },
      },
    );

    if (!userData?.data[0]) {
      throw new BadRequestException('User not found in IDP');
    }

    const currentUser = userData.data[0];
    const userId = currentUser.EmployeeId;
    if (!userId) {
      throw new BadRequestException('EmployeeId not found for user');
    }

    const allDepartmentIds = await this.getAllSubordinateDepartmentIds(
      currentUser.DepartmentId,
      IDP_SERVICE_URL,
      IDP_SERVICE_INTERNAL_TOKEN,
    );

    const allUsers = await this.getUsersFromDepartments(
      allDepartmentIds,
      IDP_SERVICE_URL,
      IDP_SERVICE_INTERNAL_TOKEN,
    );

    const managedUsers = this.getAllManagedUsers(userId, allUsers);
    const managedUserIds = managedUsers
      .map((u) => u.idpUserId)
      .filter((id): id is string => !!id);

    return managedUserIds;
  }

  //------------------------------
  private async getSupervisorManagerId(
    username: string,
  ): Promise<string | null> {
    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    try {
      const { data: userData } = await axios.get(
        `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`,
        {
          params: { ADUserName: `iranet\\${username}`, GetInternalUsers: true },
          headers: {
            'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            accept: '*/*',
          },
        },
      );

      if (!userData?.data[0]) {
        return null;
      }

      const currentUser = userData.data[0];
      const currentUserManagerId = currentUser.ManagerId;

      if (!currentUserManagerId) {
        return null;
      }

      const { data: managerData } = await axios.get(
        `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`,
        {
          params: { EmployeeId: currentUserManagerId, GetInternalUsers: true },
          headers: {
            'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            accept: '*/*',
          },
        },
      );

      if (managerData?.data[0]?.idpUserId) {
        return managerData.data[0].idpUserId;
      }

      return null;
    } catch (error) {
      console.error(
        `Failed to fetch manager for supervisor ${username}:`,
        error,
      );
      return null;
    }
  }

  //------------------------------
  private async getSupervisorManagerUsername(
    username: string,
  ): Promise<string | null> {
    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    try {
      const { data: userData } = await axios.get(
        `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`,
        {
          params: { ADUserName: `iranet\\${username}`, GetInternalUsers: true },
          headers: {
            'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            accept: '*/*',
          },
        },
      );

      if (!userData?.data[0]) {
        return null;
      }

      const currentUser = userData.data[0];
      const currentUserManagerId = currentUser.ManagerId;

      if (!currentUserManagerId) {
        return null;
      }

      const { data: managerData } = await axios.get(
        `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`,
        {
          params: { EmployeeId: currentUserManagerId, GetInternalUsers: true },
          headers: {
            'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            accept: '*/*',
          },
        },
      );

      if (!managerData?.data[0]?.ADUserName) {
        return null;
      }

      const adUsername = managerData.data[0].ADUserName;
      const managerUsername = adUsername.includes('\\')
        ? adUsername.split('\\')[1]
        : adUsername;

      return managerUsername;
    } catch (error) {
      console.error(`Failed to fetch manager username for ${username}:`, error);
      return null;
    }
  }

  //------------------------------
  private async getCurrentUserIpdUser(username: string) {
    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    const { data } = await axios.get(
      `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`,
      {
        params: { ADUserName: `iranet\\${username}`, GetInternalUsers: true },
        headers: {
          'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
          accept: '*/*',
        },
      },
    );

    return data.data[0] ?? null;
  }

  //------------------------------
  async getAllSubordinateDepartmentIds(
    departmentId: string,
    IDP_SERVICE_URL: string,
    IDP_SERVICE_INTERNAL_TOKEN: string,
  ): Promise<string[]> {
    if (!departmentId?.trim()) {
      return [];
    }

    const visited = new Set<string>();
    const queue: string[] = [departmentId];
    visited.add(departmentId);

    while (queue.length > 0) {
      const currentLevel = [...queue];
      queue.length = 0;

      const fetchPromises = currentLevel.map(async (parentId) => {
        try {
          const response = await axios.get(
            `${IDP_SERVICE_URL}/idp/api/v1/auth/get-downward-department-internal/${encodeURIComponent(parentId)}`,
            {
              headers: {
                'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
                Accept: 'application/json',
              },
            },
          );

          const rawData = response.data?.data;

          if (!Array.isArray(rawData)) {
            return [];
          }

          const rawChildIds = rawData.map((dept: any) => dept?.departmentId);
          const newChildren = rawChildIds.filter(
            (id: unknown): id is string => {
              if (typeof id !== 'string' || id.trim() === '') {
                return false;
              }
              if (visited.has(id)) {
                return false;
              }
              return true;
            },
          );

          return newChildren;
        } catch (error) {
          console.error(
            `Failed to fetch children for ${parentId}:`,
            error.message || error,
          );
          return [];
        }
      });

      const allNewChildrenArrays = await Promise.all(fetchPromises);
      const allNewChildren = allNewChildrenArrays.flat();

      for (const childId of allNewChildren) {
        visited.add(childId);
        queue.push(childId);
      }
    }

    const result = Array.from(visited);
    return result;
  }

  //------------------------------
  async getUsersFromDepartments(
    departmentIds: string[],
    IDP_SERVICE_URL: string,
    IDP_SERVICE_INTERNAL_TOKEN: string,
  ): Promise<any[]> {
    if (!departmentIds || departmentIds.length === 0) {
      return [];
    }

    const uniqueDeptIds = [...new Set(departmentIds)];

    const CHUNK_SIZE = 5;
    const allUsers: any[] = [];

    for (let i = 0; i < uniqueDeptIds.length; i += CHUNK_SIZE) {
      const chunk = uniqueDeptIds.slice(i, i + CHUNK_SIZE);

      const promises = chunk.map(async (deptId) => {
        try {
          const { data: response } = await axios.get(
            `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`,
            {
              params: { DepartmentId: deptId, GetInternalUsers: true },
              headers: {
                'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
                accept: '*/*',
              },
            },
          );

          const users = response?.data || [];
          return users;
        } catch (err) {
          console.log(err);
          return [];
        }
      });

      const chunkResults = await Promise.all(promises);
      const flattened = chunkResults.flat();
      allUsers.push(...flattened);
    }

    return allUsers;
  }

  //------------------------------
  public async buildSupervisorScope(username: string): Promise<string[]> {
    const currentUserInfo = await this.getCurrentUserIpdUser(username);
    const currentUserIpdUserId = currentUserInfo.idpUserId;
    // const currentUserPositionId = currentUserInfo.PositionId;

    const subordinateUsers = await this.getSubordinateUsers(username);
    const baseScope = [currentUserIpdUserId, ...subordinateUsers];

    // if (
    //   currentUserPositionId == HRMSPositions.Deputy ||
    //   currentUserPositionId == HRMSPositions.ActingManager ||
    //   currentUserPositionId == HRMSPositions.Manager ||
    //   currentUserPositionId == HRMSPositions.Director ||
    //   currentUserPositionId == HRMSPositions.ActingDirector
    // ) {
    return [...new Set(baseScope)];
    // }

    // const managerUsername = await this.getSupervisorManagerUsername(username);

    // const managerScope: string[] = [];
    // if (managerUsername) {
    //   const supervisorManagerId =
    //     await this.getCurrentUserIpdUser(managerUsername);
    //   if (supervisorManagerId) {
    //     managerScope.push(supervisorManagerId.idpUserId);
    //   }

    //   const managerSubordinates =
    //     await this.getSubordinateUsers(managerUsername);
    //   managerScope.push(...managerSubordinates);
    // }

    // const fullScope = [...baseScope, ...managerScope];
    // return [...new Set(fullScope)];
  }

  //------------------------------
  public async buildAssetUserScope(username: string): Promise<string[]> {
    return await this.getAssetUserScopeIds(username);
  }

  //------------------------------
  getAllManagedUsers(userId: string, allUsers: any[]): any[] {
    if (!Array.isArray(allUsers) || allUsers.length === 0 || !userId) {
      return [];
    }

    const employeeMap = new Map<string, any>();
    const reportsMap = new Map<string, any[]>();

    for (const user of allUsers) {
      const empId = user.EmployeeId;
      const mgrId = user.ManagerId;

      if (empId) employeeMap.set(empId, user);
      if (mgrId) {
        if (!reportsMap.has(mgrId)) reportsMap.set(mgrId, []);
        reportsMap.get(mgrId)!.push(user);
      }
    }

    const managedUsers: any[] = [];
    const visited = new Set<string>();
    const queue: string[] = [];

    const directReports = reportsMap.get(userId) || [];
    for (const report of directReports) {
      const id = report.EmployeeId;
      if (id && !visited.has(id)) {
        visited.add(id);
        queue.push(id);
      }
    }

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const user = employeeMap.get(currentId);
      if (user) managedUsers.push(user);

      const theirReports = reportsMap.get(currentId) || [];
      for (const report of theirReports) {
        const reportId = report.EmployeeId;
        if (reportId && !visited.has(reportId)) {
          visited.add(reportId);
          queue.push(reportId);
        }
      }
    }

    return managedUsers;
  }

  //------------------------------
  async getAssetUserScopeIds(username: string): Promise<string[]> {
    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    try {
      const { data: userData } = await axios.get(
        `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`,
        {
          params: { ADUserName: `iranet\\${username}`, GetInternalUsers: true },
          headers: {
            'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            accept: '*/*',
          },
        },
      );

      if (!userData?.data[0]) {
        throw new BadRequestException('User not found in IDP');
      }

      const currentUser = userData.data[0];
      const currentDepartmentId = currentUser.DepartmentId;
      const currentUserId = currentUser.idpUserId;
      const currentUserManagerId = currentUser.ManagerId;

      if (!currentDepartmentId || !currentUserId) {
        throw new BadRequestException('Required user information not found');
      }

      const { data: departmentUsersData } = await axios.get(
        `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`,
        {
          params: { DepartmentId: currentDepartmentId, GetInternalUsers: true },
          headers: {
            'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            accept: '*/*',
          },
        },
      );

      const departmentUsers = departmentUsersData?.data || [];
      const departmentEmployeeIds = departmentUsers
        .map((u: any) => u.idpUserId)
        .filter((id: any): id is string => !!id);

      let managerEmployeeId: string | undefined;
      if (currentUserManagerId) {
        const { data: managerData } = await axios.get(
          `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`,
          {
            params: {
              EmployeeId: currentUserManagerId,
              GetInternalUsers: true,
            },
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
              accept: '*/*',
            },
          },
        );

        if (managerData?.data[0]?.idpUserId) {
          managerEmployeeId = managerData.data[0].idpUserId;
        }
      }

      const allEmployeeIds = new Set<string>([
        currentUserId,
        ...departmentEmployeeIds,
        ...(managerEmployeeId ? [managerEmployeeId] : []),
      ]);

      return Array.from(allEmployeeIds);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('');
    }
  }

  //------------------------------
  async getLastWeekAssetVersions(user: User | any, userRoles: Role[]) {
    const hasAdministratorRole = userRoles.some(
      (r) => r.name === AssetRoles.AssetAdministrator,
    );

    let scopeEmployeeIds: string[] = [];
    let assetUserScopeIds: string[] = [];
    let hasSupervisor = false;
    let shouldApplyUserScope = false;

    if (!hasAdministratorRole) {
      hasSupervisor = userRoles.some(
        (role) => role.name === AssetRoles.AssetSupervisor,
      );
      if (hasSupervisor) {
        scopeEmployeeIds = await this.buildSupervisorScope(user.username);
      }

      const hasAuditor = userRoles.some(
        (role) => role.name === AssetRoles.AssetAuditor,
      );
      const hasAssetUser = userRoles.some(
        (role) => role.name === AssetRoles.AssetUser,
      );

      const hasFullAccess = hasSupervisor || hasAuditor;
      shouldApplyUserScope = hasAssetUser && !hasFullAccess;

      if (shouldApplyUserScope) {
        assetUserScopeIds = await this.buildAssetUserScope(user.username);
      }
    }

    const queryOptions: GetFilteredAssetVersions = {
      ...(shouldApplyUserScope && { assetUserScopeIds }),
      ...(hasSupervisor && { supervisorEmployeeIds: scopeEmployeeIds }),
    };

    return await this.assetVersionRepository.getLastWeekAssetVersions(
      queryOptions,
    );
  }

  //------------------------------
  async getAccessibleAssets(user: User | any, userRoles: Role[]) {
    const hasAdministratorRole = userRoles.some(
      (r) => r.name === AssetRoles.AssetAdministrator,
    );

    let scopeEmployeeIds: string[] = [];
    let assetUserScopeIds: string[] = [];
    let hasSupervisor = false;
    let shouldApplyUserScope = false;

    if (!hasAdministratorRole) {
      hasSupervisor = userRoles.some(
        (role) => role.name === AssetRoles.AssetSupervisor,
      );
      if (hasSupervisor) {
        scopeEmployeeIds = await this.buildSupervisorScope(user.username);
      }

      const hasAuditor = userRoles.some(
        (role) => role.name === AssetRoles.AssetAuditor,
      );
      const hasAssetUser = userRoles.some(
        (role) => role.name === AssetRoles.AssetUser,
      );

      const hasFullAccess = hasSupervisor || hasAuditor;
      shouldApplyUserScope = hasAssetUser && !hasFullAccess;

      if (shouldApplyUserScope) {
        assetUserScopeIds = await this.buildAssetUserScope(user.username);
      }
    }

    const queryOptions: GetFilteredAssetVersions = {
      ...(shouldApplyUserScope && { assetUserScopeIds }),
      ...(hasSupervisor && { supervisorEmployeeIds: scopeEmployeeIds }),
    };

    const accessibleCount =
      await this.assetVersionRepository.findAllWithFilterForDashboard(
        queryOptions,
      );

    const totalCount = await this.assetVersionRepository.count({
      where: { archived: false },
    });

    return {
      accessibleCount,
      totalCount,
    };
  }

  //------------------------------
  async getAccessibleAssetsByTypes(user: User | any, userRoles: Role[]) {
    const hasAdministratorRole = userRoles.some(
      (r) => r.name === AssetRoles.AssetAdministrator,
    );

    let scopeEmployeeIds: string[] = [];
    let assetUserScopeIds: string[] = [];
    let hasSupervisor = false;
    let shouldApplyUserScope = false;

    if (!hasAdministratorRole) {
      hasSupervisor = userRoles.some(
        (role) => role.name === AssetRoles.AssetSupervisor,
      );

      if (hasSupervisor) {
        scopeEmployeeIds = await this.buildSupervisorScope(user.username);
      }

      const hasAuditor = userRoles.some(
        (role) => role.name === AssetRoles.AssetAuditor,
      );

      const hasAssetUser = userRoles.some(
        (role) => role.name === AssetRoles.AssetUser,
      );

      const hasFullAccess = hasSupervisor || hasAuditor;
      shouldApplyUserScope = hasAssetUser && !hasFullAccess;

      if (shouldApplyUserScope) {
        assetUserScopeIds = await this.buildAssetUserScope(user.username);
      }
    }

    const queryOptions: GetFilteredAssetVersions = {
      ...(shouldApplyUserScope && { assetUserScopeIds }),
      ...(hasSupervisor && { supervisorEmployeeIds: scopeEmployeeIds }),
    };

    const accessibleByAssetType =
      await this.assetVersionRepository.findGroupedByAssetTypeForDashboard(
        queryOptions,
      );

    return accessibleByAssetType;
  }

  //------------------------------
  async getAccessibleAssetVersionResponsibilityCounts(
    user: User | any,
    userRoles: Role[],
  ) {
    const hasAdministratorRole = userRoles.some(
      (r) => r.name === AssetRoles.AssetAdministrator,
    );

    let supervisorEmployeeIds: string[] = [];
    let assetUserScopeIds: string[] = [];
    let hasSupervisor = false;
    let shouldApplyUserScope = false;

    if (!hasAdministratorRole) {
      hasSupervisor = userRoles.some(
        (role) => role.name === AssetRoles.AssetSupervisor,
      );

      if (hasSupervisor) {
        supervisorEmployeeIds = await this.buildSupervisorScope(user.username);
      }

      const hasAuditor = userRoles.some(
        (role) => role.name === AssetRoles.AssetAuditor,
      );

      const hasAssetUser = userRoles.some(
        (role) => role.name === AssetRoles.AssetUser,
      );

      const hasFullAccess = hasSupervisor || hasAuditor;
      shouldApplyUserScope = hasAssetUser && !hasFullAccess;

      if (shouldApplyUserScope) {
        assetUserScopeIds = await this.buildAssetUserScope(user.username);
      }
    }

    const queryOptions: GetFilteredAssetVersions = {
      ...(shouldApplyUserScope && { assetUserScopeIds }),
      ...(hasSupervisor && {
        supervisorEmployeeIds: supervisorEmployeeIds,
      }),
    };

    return this.assetVersionRepository.findGroupedByResponsibilityForDashboard(
      queryOptions,
      user.id,
    );
  }

  //------------------------------
  async getLogSourceTypes(query: GetLogSourceGroupsDTO, user: IDPUser) {
    const LSW_TOKEN = await Vault.instance.get('LSW_TOKEN');
    const LSW_URL = await Vault.instance.get('LSW_URL');

    const { data } = await axios.get<LogSourceType[]>(
      `${LSW_URL}/qradar-lookup/log-source-types`,
      {
        headers: {
          'X-Server-Auth-Key': LSW_TOKEN,
          'X-Server-Username': user.username,
        },
      },
    );

    let logSourceTypeToReturn = data;
    if (query.label) {
      logSourceTypeToReturn = logSourceTypeToReturn.filter((logSourceType) =>
        logSourceType.name
          .toLowerCase()
          .includes(query.label.toLocaleLowerCase()),
      );
    }
    return [
      logSourceTypeToReturn
        .sort((logSourceType) => logSourceType.id)
        .map((logSourceType) => {
          return {
            label: logSourceType.name,
            value: { ID: logSourceType.id, Name: logSourceType.name },
          };
        })
        .splice(query.skip, query.take),
      logSourceTypeToReturn.length,
    ];
  }

  //------------------------------
  async getLogSourceGroups(query: GetLogSourceGroupsDTO, user: IDPUser) {
    const LSW_TOKEN = await Vault.instance.get('LSW_TOKEN');
    const LSW_URL = await Vault.instance.get('LSW_URL');

    const { data: groups } = await axios.get<LogSourceType[]>(
      `${LSW_URL}/qradar-lookup/log-source-types`,
      {
        headers: {
          'X-Server-Auth-Key': LSW_TOKEN,
          'X-Server-Username': user.username,
        },
      },
    );

    let groupsToReturn = groups;

    if (query.label) {
      groupsToReturn = groupsToReturn.filter((protocolType) =>
        protocolType.name
          .toLowerCase()
          .includes(query.label.toLocaleLowerCase()),
      );
    }

    return [
      groupsToReturn
        .sort((logSourceType) => logSourceType.id)
        .map((logSourceType) => {
          return {
            label: logSourceType.name,
            value: { ID: logSourceType.id, Name: logSourceType.name },
          };
        })
        .splice(query.skip, query.take),
      groupsToReturn.length,
    ];
  }

  //------------------------------
  async getLogSourceProtocols(
    query: GetLogSourceGroupsDTO,
    typeId: string,
    user: IDPUser,
  ) {
    const LSW_TOKEN = await Vault.instance.get('LSW_TOKEN');
    const LSW_URL = await Vault.instance.get('LSW_URL');

    const { data } = await axios.get<LogSourceType[]>(
      `${LSW_URL}/qradar-lookup/log-source-types`,
      {
        headers: {
          'X-Server-Auth-Key': LSW_TOKEN,
          'X-Server-Username': user.username,
        },
      },
    );

    const logSource = data
      .find((logSourceType) => logSourceType.id === +typeId)
      ?.protocol_types.map((protocolType) => protocolType.protocol_id);

    if (!logSource) {
      return [[], 0];
    }

    const { data: protocolType } = await axios.get<ProtocolType[]>(
      `${LSW_URL}/qradar-lookup/protocol-types`,
      {
        headers: {
          'X-Server-Auth-Key': LSW_TOKEN,
          'X-Server-Username': user.username,
        },
      },
    );

    let protocolTypeToReturn = protocolType.filter((protocolType) =>
      logSource.includes(protocolType.id),
    );

    if (query.label) {
      protocolTypeToReturn = protocolTypeToReturn.filter((protocolType) =>
        protocolType.name
          .toLowerCase()
          .includes(query.label.toLocaleLowerCase()),
      );
    }

    return [
      protocolTypeToReturn
        .sort((logSourceType) => logSourceType.id)
        .map((logSourceType) => {
          return {
            label: logSourceType.name,
            value: { ID: logSourceType.id, Name: logSourceType.name },
          };
        })
        .splice(query.skip, query.take),
      protocolTypeToReturn.length,
    ];
  }

  async changeAssetStatus(
    body: AssetChangeStatusDto,
    id: string,
    user: IDPUser,
  ) {
    const assetVersion = await this.assetVersionRepository.findOne({
      where: { id },
      relations: { assetTypeVersion: true, asset: true },
    });

    if (!assetVersion) {
      throw new NotFoundException({
        message: this.i18nService.t('messages.ERROR_ASSET_VERSION_NOT_FOUND'),
      });
    }

    assetVersion.status = body.status;

    if (
      assetVersion.assetTypeVersion?.classification ===
        AssetTypeClassificationEnum.LogSource &&
      assetVersion.asset
    ) {
      const LSW_TOKEN = await Vault.instance.get('LSW_TOKEN');
      const LSW_URL = await Vault.instance.get('LSW_URL');

      const payload = undefined;
      const config: AxiosRequestConfig = {
        headers: {
          'X-Server-Auth-Key': LSW_TOKEN,
          'X-Server-Username': user.username,
        },
      };

      let url: string = '';
      if (body.status === AssetStatusEnum.Approved) {
        url = `${LSW_URL}/request-change/${assetVersion.asset.externalRefId}/approve/`;
      } else if (body.status === AssetStatusEnum.Declined) {
        url = `${LSW_URL}/request-change/${assetVersion.asset.externalRefId}/reject/`;
      }

      if (!url) {
        throw new BadRequestException();
      }

      try {
        await axios.post(url, payload, config);
      } catch (error) {
        const curlCommand = storeFailedCurlRequest(
          url,
          'POST',
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

    this.assetVersionRepository.save(assetVersion);
  }
}
