import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
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

type ExcelReportSheetState = {
  worksheet: ExcelJS.Worksheet;
  columnsReady: boolean;
  keys: string[];
  maxWidths: number[];
};

@Injectable()
export class AssetService {
  private readonly userScopeLogger = new Logger('UserScope');

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
  private createUserScopeTraceId(): string {
    return `us-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  //------------------------------
  private logUserScope(
    traceId: string,
    step: string,
    details: Record<string, unknown> = {},
  ) {
    this.userScopeLogger.log(
      JSON.stringify({
        tag: 'USER_SCOPE',
        traceId,
        step,
        ...details,
      }),
    );
  }

  //------------------------------
  private summarizeEmployees(employees: any[], limit = 40) {
    const list = Array.isArray(employees) ? employees : [];
    return {
      count: list.length,
      people: list.slice(0, limit).map((employee) => ({
        EmployeeId: employee?.EmployeeId ?? null,
        idpUserId: employee?.idpUserId ?? employee?.IdpUserId ?? null,
        ManagerId: employee?.ManagerId ?? null,
        DepartmentId: employee?.DepartmentId ?? null,
        ADUserName: employee?.ADUserName ?? null,
        extractedScopeId: this.extractEmployeeScopeId(employee) ?? null,
      })),
      truncated: list.length > limit,
    };
  }

  //------------------------------
  private describePayloadShape(payload: unknown) {
    if (Array.isArray(payload)) {
      return { kind: 'array', length: payload.length };
    }
    if (payload && typeof payload === 'object') {
      const data = (payload as { data?: unknown }).data;
      return {
        kind: 'object',
        keys: Object.keys(payload as object),
        dataIsArray: Array.isArray(data),
        dataLength: Array.isArray(data) ? data.length : undefined,
        nestedDataIsArray: Array.isArray(
          (data as { data?: unknown } | undefined)?.data,
        ),
      };
    }
    return { kind: typeof payload };
  }

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
    let accountableHierarchy: Record<string, string | null | undefined> = {};
    let editorHierarchy: Record<string, string | null | undefined> = {};

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
      accountableHierarchy = {
        accountableDeputyId: accountableResponse.data.VicePresidentId,
        accountableDeputyName: accountableResponse.data.VicePresidentName,
        accountableManagementId: accountableResponse.data.ManagementId,
        accountableManagementName: accountableResponse.data.ManagementName,
        accountableGroupId: accountableResponse.data.GroupId,
        accountableGroupName: accountableResponse.data.GroupName,
      };

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
        editorHierarchy = {
          editorDeputyId: editorResponse.data.VicePresidentId,
          editorDeputyName: editorResponse.data.VicePresidentName,
          editorManagementId: editorResponse.data.ManagementId,
          editorManagementName: editorResponse.data.ManagementName,
          editorGroupId: editorResponse.data.GroupId,
          editorGroupName: editorResponse.data.GroupName,
        };
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    Object.assign(data, accountableHierarchy, editorHierarchy);

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
          data.status = AssetStatusEnum.Pending;
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

          if (axios.isAxiosError(error)) {
            if (typeof error.response?.data?.detail === 'string') {
              throw new BadRequestException([error.response.data.detail]);
            } else if (Array.isArray(error.response?.data?.detail)) {
              throw new BadRequestException(error.response.data.detail);
            }
          }

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
        assetId: createdVersion?.id,
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
    let accountableHierarchy: Record<string, string | null | undefined> = {};
    let editorHierarchy: Record<string, string | null | undefined> = {};

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
        accountableHierarchy = {
          accountableDeputyId: idpData.data.VicePresidentId,
          accountableDeputyName: idpData.data.VicePresidentName,
          accountableManagementId: idpData.data.ManagementId,
          accountableManagementName: idpData.data.ManagementName,
          accountableGroupId: idpData.data.GroupId,
          accountableGroupName: idpData.data.GroupName,
        };

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
          editorHierarchy = {
            editorDeputyId: idpData2.data.VicePresidentId,
            editorDeputyName: idpData2.data.VicePresidentName,
            editorManagementId: idpData2.data.ManagementId,
            editorManagementName: idpData2.data.ManagementName,
            editorGroupId: idpData2.data.GroupId,
            editorGroupName: idpData2.data.GroupName,
          };
        }
      } catch (err) {
        errors.push({ step: 'Fetching User Info', message: err.message });
        return { errors };
      }

      Object.assign(data, accountableHierarchy, editorHierarchy);

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

        if (createdAsset?.errors?.length || !createdAsset?.asset) {
          return {
            errors: createdAsset?.errors ?? [
              {
                step: 'Asset Creation',
                message: 'Asset creation did not return a persisted asset',
              },
            ],
          };
        }

        return { asset: createdAsset.asset };
      } catch (error) {
        errors.push({
          step: 'Asset Creation',
          message: `Error during creating asset: ${error.message}`,
        });
        return { errors };
      }
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
  async findOneAsset(
    data: FindOneOptions<AssetVersion>,
    user?: IDPUser,
    userRoles: Role[] = [],
    checkModificationAccess = false,
  ) {
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

    if (checkModificationAccess) {
      const unauthorizedMessage = this.i18nService.t(
        'messages.ERROR_NOT_AUTHORIZED_TO_CREATE_OR_UPDATE_ASSET',
      );
      const traceId = this.createUserScopeTraceId();
      const roleNames = (userRoles || []).map((role) => role.name);
      const hasAdministratorRole = userRoles.some(
        (r) => r.name === AssetRoles.AssetAdministrator,
      );
      const hasAuditorRole = userRoles.some(
        (r) => r.name === AssetRoles.AssetAuditor,
      );
      const hasSupervisorRole = userRoles.some(
        (r) => r.name === AssetRoles.AssetSupervisor,
      );
      const hasUserRole = userRoles.some((r) => r.name === AssetRoles.AssetUser);

      this.logUserScope(traceId, 'find-one-access.start', {
        username: user?.username,
        userId: user?.id,
        assetVersionId: assetVersion.id,
        accountableId: assetVersion.accountableId ?? null,
        editorId: assetVersion.editorId ?? null,
        roleNames,
        hasAdministratorRole,
        hasAuditorRole,
        hasSupervisorRole,
        hasUserRole,
      });

      if (hasAdministratorRole) {
        this.logUserScope(traceId, 'find-one-access.allow', {
          reason: 'administrator',
        });
      } else if (hasAuditorRole) {
        this.logUserScope(traceId, 'find-one-access.allow', {
          reason: 'auditor',
        });
      } else if (hasSupervisorRole && user) {
        const supervisorScopeIds = await this.buildSupervisorScope(
          user.username,
          user.id,
          traceId,
        );
        const hasAccess =
          (assetVersion.accountableId &&
            supervisorScopeIds.includes(assetVersion.accountableId)) ||
          (assetVersion.editorId &&
            supervisorScopeIds.includes(assetVersion.editorId));

        this.logUserScope(
          traceId,
          hasAccess ? 'find-one-access.allow' : 'find-one-access.deny',
          {
            reason: 'supervisor',
            accountableId: assetVersion.accountableId ?? null,
            editorId: assetVersion.editorId ?? null,
            supervisorCount: supervisorScopeIds.length,
            supervisorScopeIds,
            hasAccess,
          },
        );

        if (!hasAccess) {
          throw new ForbiddenException(unauthorizedMessage);
        }
      } else if (hasUserRole && user) {
        const isDirectlyResponsible =
          user.id === assetVersion.accountableId ||
          user.id === assetVersion.editorId;

        if (isDirectlyResponsible) {
          this.logUserScope(traceId, 'find-one-access.allow', {
            reason: 'asset-user-direct',
            userId: user.id,
            accountableId: assetVersion.accountableId ?? null,
            editorId: assetVersion.editorId ?? null,
          });
        } else {
          const assetUserScopeIds = await this.buildAssetUserScope(
            user.username,
            user.id,
            traceId,
          );
          const hasAccess =
            (assetVersion.accountableId &&
              assetUserScopeIds.includes(assetVersion.accountableId)) ||
            (assetVersion.editorId &&
              assetUserScopeIds.includes(assetVersion.editorId));

          this.logUserScope(
            traceId,
            hasAccess ? 'find-one-access.allow' : 'find-one-access.deny',
            {
              reason: 'asset-user-scope',
              accountableId: assetVersion.accountableId ?? null,
              editorId: assetVersion.editorId ?? null,
              assetUserCount: assetUserScopeIds.length,
              assetUserScopeIds,
              hasAccess,
            },
          );

          if (!hasAccess) {
            throw new ForbiddenException(unauthorizedMessage);
          }
        }
      } else {
        this.logUserScope(traceId, 'find-one-access.deny', {
          reason: 'no-matching-role',
        });
        throw new ForbiddenException(unauthorizedMessage);
      }
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
  private async resolveUserScopeQueryOptions(
    user: User | any,
    userRoles: Role[],
    source = 'unknown',
  ): Promise<
    Pick<FindAllAssetQueryDto, 'assetUserScopeIds' | 'supervisorEmployeeIds'>
  > {
    const traceId = this.createUserScopeTraceId();
    const roleNames = (userRoles || []).map((role) => role.name);
    this.logUserScope(traceId, 'resolve.start', {
      source,
      username: user?.username,
      userId: user?.id,
      roleNames,
    });

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
        this.logUserScope(traceId, 'resolve.supervisor', {
          username: user?.username,
        });
        scopeEmployeeIds = await this.buildSupervisorScope(
          user.username,
          user.id,
          traceId,
        );
      }

      const hasAuditor = userRoles.some(
        (role) => role.name === AssetRoles.AssetAuditor,
      );
      const hasAssetUser = userRoles.some(
        (role) => role.name === AssetRoles.AssetUser,
      );

      const hasFullAccess = hasSupervisor || hasAuditor;
      shouldApplyUserScope = hasAssetUser && !hasFullAccess;

      this.logUserScope(traceId, 'resolve.roles', {
        hasAdministratorRole,
        hasSupervisor,
        hasAuditor,
        hasAssetUser,
        hasFullAccess,
        shouldApplyUserScope,
      });

      if (shouldApplyUserScope) {
        assetUserScopeIds = await this.buildAssetUserScope(
          user.username,
          user.id,
          traceId,
        );
      }
    } else {
      this.logUserScope(traceId, 'resolve.administrator', {
        message: 'No user-scope filter applied',
      });
    }

    if (
      hasSupervisor &&
      scopeEmployeeIds.length === 0 &&
      typeof user?.id === 'string'
    ) {
      this.logUserScope(traceId, 'resolve.supervisor-empty-fallback', {
        fallbackUserId: user.id,
      });
      scopeEmployeeIds = [user.id];
    }

    const result = {
      ...(shouldApplyUserScope && { assetUserScopeIds }),
      ...(hasSupervisor && { supervisorEmployeeIds: scopeEmployeeIds }),
    };

    this.logUserScope(traceId, 'resolve.done', {
      source,
      supervisorCount: scopeEmployeeIds.length,
      supervisorEmployeeIds: scopeEmployeeIds,
      assetUserCount: assetUserScopeIds.length,
      assetUserScopeIds,
      applied: result,
    });

    return result;
  }

  //------------------------------
  async searchUserScope(
    user: User | any,
    userRoles: Role[],
    query: findAllAssetReportQueryDto,
    body: searchBodyTag,
  ) {
    const scopeQueryOptions = await this.resolveUserScopeQueryOptions(
      user,
      userRoles,
      'searchUserScope',
    );

    const elasticQuery: Record<string, any>[] = [{ term: { archived: false } }];
    const {
      tags,
      name,
      externalRefId,
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
        accountableId:
          typeof accountableId === 'string' ? accountableId : undefined,
        editorId: typeof editorId === 'string' ? editorId : undefined,
        assetCategoryId:
          typeof assetCategoryId === 'string' ? assetCategoryId : undefined,
        locationTypeId:
          typeof locationTypeId === 'string' ? locationTypeId : undefined,
        locationId: typeof locationId === 'string' ? locationId : undefined,
        name: typeof name === 'string' ? name : undefined,
        externalRefId:
          typeof externalRefId === 'string' ? externalRefId : undefined,
        assetTypeVersionId:
          typeof assetTypeVersionId === 'string'
            ? assetTypeVersionId
            : undefined,
        assetTypeId: typeof assetTypeId === 'string' ? assetTypeId : undefined,
        ...scopeQueryOptions,
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
          continue;
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
        data[key0 ? `${key0}.${key}` : key] = value.toString();
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
    data.location_code = assetVersion.location?.code;
    data.location_address = assetVersion.location?.address;
    data.accountableDeputy = accountable?.VicePresidentName || '';
    data.accountableManagement = accountable?.ManagementName || '';
    data.accountableGroup = accountable?.GroupName || '';
    data.accountableName =
      (accountable?.FirstName || '') + ' ' + (accountable?.LastName || '');
    data.accountableId = accountable?.ADUserName.split('\\')[1];

    data.responsibleDeputy = responsible?.VicePresidentName || '';
    data.responsibleManagement = responsible?.ManagementName || '';
    data.responsibleGroup = responsible?.GroupName || '';
    data.responsibleName =
      (responsible?.FirstName || '') + ' ' + (responsible?.LastName || '');
    data.responsibleId = responsible?.ADUserName.split('\\')[1];

    this.flattenAssetContent(content, data);

    for (let i = 0; i < relationsUniqueBy.length; i++) {
      const element = relationsUniqueBy[i];

      data[`relation_${element.asset?.assetType?.name}`] = data[
        `relation_${element.asset?.assetType?.name}`
      ]
        ? data[`relation_${element.asset?.assetType?.name}`] +
          ';' +
          element.asset?.externalRefId +
          '{v:' +
          element.version +
          '}'
        : element.asset?.externalRefId + '{v:' + element.version + '}';
    }
    return data;
  }

  //------------------------------
  formatReportColumnHeader(key: string): string {
    return key
      .replace(/[._]/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  //------------------------------
  private sanitizeExportFilename(name: string): string {
    const safe = (name || 'asset-report')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return safe || 'asset-report';
  }

  //------------------------------
  private getExcelThinBorder(): Partial<ExcelJS.Borders> {
    const edge: Partial<ExcelJS.Border> = {
      style: 'thin',
      color: { argb: 'FFD0D7DE' },
    };
    return { top: edge, left: edge, bottom: edge, right: edge };
  }

  //------------------------------
  private isNumericReportValue(key: string, value: unknown): boolean {
    if (/id|code|ref|phone|username|address/i.test(key)) {
      return false;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value);
    }
    if (typeof value !== 'string') {
      return false;
    }
    return /^-?\d+(\.\d+)?$/.test(value.trim());
  }

  //------------------------------
  private isDateReportValue(value: unknown): boolean {
    if (value instanceof Date) {
      return !Number.isNaN(value.getTime());
    }
    if (typeof value !== 'string') {
      return false;
    }
    return /^\d{4}-\d{2}-\d{2}(T|\s|$)/.test(value.trim());
  }

  //------------------------------
  private coerceExcelCellValue(key: string, value: unknown): ExcelJS.CellValue {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (this.isDateReportValue(value)) {
      return value instanceof Date ? value : new Date(String(value));
    }
    if (this.isNumericReportValue(key, value)) {
      return typeof value === 'number' ? value : Number(value);
    }
    if (Array.isArray(value)) {
      return value.join('; ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  //------------------------------
  private collectReportColumnKeys(
    rows: Array<Record<string, unknown> | undefined>,
  ): string[] {
    const keys: string[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      if (!row) {
        continue;
      }
      for (const key of Object.keys(row)) {
        if (!seen.has(key)) {
          seen.add(key);
          keys.push(key);
        }
      }
    }
    return keys;
  }

  //------------------------------
  private collectElasticFilterRows(
    elasticQuery: Record<string, any>[],
  ): Array<{ label: string; value: string }> {
    const rows: Array<{ label: string; value: string }> = [];
    for (const element of elasticQuery) {
      for (const kind of ['terms', 'match_phrase', 'match', 'range'] as const) {
        if (!element[kind]) {
          continue;
        }
        for (const [key, value] of Object.entries(element[kind])) {
          rows.push({
            label: this.formatReportColumnHeader(key),
            value: Array.isArray(value) ? value.join(', ') : String(value),
          });
        }
      }
    }
    return rows;
  }

  //------------------------------
  private createExcelReportSheetState(
    worksheet: ExcelJS.Worksheet,
  ): ExcelReportSheetState {
    return {
      worksheet,
      columnsReady: false,
      keys: [],
      maxWidths: [],
    };
  }

  //------------------------------
  private createExcelReportDataSheet(
    workbook: ExcelJS.stream.xlsx.WorkbookWriter,
    name: string,
  ): ExcelJS.Worksheet {
    return workbook.addWorksheet(name, {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
      properties: { defaultRowHeight: 18 },
    });
  }

  //------------------------------
  private prepareExcelReportDataSheet(
    worksheet: ExcelJS.Worksheet,
    keys: string[],
  ): number[] {
    worksheet.columns = keys.map((key) => {
      const header = this.formatReportColumnHeader(key);
      return {
        header,
        key,
        width: Math.min(48, Math.max(12, header.length + 4)),
      };
    });

    const headerRow = worksheet.getRow(1);
    headerRow.height = 22;
    headerRow.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      name: 'Calibri',
      size: 11,
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };
    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    headerRow.eachCell((cell: ExcelJS.Cell) => {
      cell.border = this.getExcelThinBorder();
    });
    headerRow.commit();

    return keys.map((key) =>
      Math.min(48, Math.max(12, this.formatReportColumnHeader(key).length + 4)),
    );
  }

  //------------------------------
  private styleExcelReportDataRow(
    row: ExcelJS.Row,
    keys: string[],
    values: Record<string, unknown>,
  ) {
    const isAlt = row.number % 2 === 0;
    row.font = { name: 'Calibri', size: 10 };
    row.alignment = { vertical: 'middle', wrapText: true };
    row.height = 18;

    row.eachCell(
      { includeEmpty: true },
      (cell: ExcelJS.Cell, colNumber: number) => {
        const key = keys[colNumber - 1] || '';
        const raw = values[key];
        cell.border = this.getExcelThinBorder();
        cell.alignment = {
          vertical: 'middle',
          horizontal: this.isNumericReportValue(key, raw) ? 'right' : 'left',
          wrapText: true,
        };
        if (isAlt) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF7F9FC' },
          };
        }
        if (this.isDateReportValue(raw)) {
          cell.numFmt = 'yyyy-mm-dd hh:mm';
        } else if (this.isNumericReportValue(key, raw)) {
          const numericValue =
            typeof cell.value === 'number' ? cell.value : Number(raw);
          cell.numFmt = Number.isInteger(numericValue) ? '#,##0' : '#,##0.00';
        }
      },
    );
  }

  //------------------------------
  private updateExcelColumnWidths(
    maxWidths: number[],
    keys: string[],
    values: Record<string, unknown>,
  ) {
    keys.forEach((key, index) => {
      const cellText = String(this.coerceExcelCellValue(key, values[key]) ?? '');
      maxWidths[index] = Math.min(
        48,
        Math.max(maxWidths[index] || 12, cellText.length + 2),
      );
    });
  }

  //------------------------------
  private finalizeExcelReportDataSheet(state: ExcelReportSheetState) {
    const { worksheet, keys, maxWidths } = state;
    if (keys.length === 0) {
      worksheet.getCell('A1').value = 'No records';
      worksheet.getCell('A1').font = {
        italic: true,
        color: { argb: 'FF6B7280' },
        name: 'Calibri',
        size: 11,
      };
      worksheet.getColumn(1).width = 20;
      return;
    }

    worksheet.columns.forEach((column: Partial<ExcelJS.Column>, index: number) => {
      column.width = maxWidths[index] || 12;
    });

    const lastColumn = worksheet.getColumn(keys.length);
    const lastRow = Math.max(worksheet.rowCount, 1);
    if (lastColumn.letter) {
      worksheet.autoFilter = {
        from: 'A1',
        to: `${lastColumn.letter}${lastRow}`,
      };
    }
  }

  //------------------------------
  private writeExcelReportRows(
    state: ExcelReportSheetState,
    mappedData: Array<Record<string, unknown> | undefined>,
  ) {
    const rows = mappedData.filter(
      (row): row is Record<string, unknown> => row !== undefined,
    );
    if (rows.length === 0) {
      return;
    }

    if (!state.columnsReady) {
      state.keys = this.collectReportColumnKeys(rows);
      state.maxWidths = this.prepareExcelReportDataSheet(
        state.worksheet,
        state.keys,
      );
      state.columnsReady = true;
    }

    for (const element of rows) {
      const normalized: Record<string, ExcelJS.CellValue> = {};
      for (const key of state.keys) {
        normalized[key] = this.coerceExcelCellValue(key, element[key]);
      }
      const row = state.worksheet.addRow(normalized);
      this.styleExcelReportDataRow(row, state.keys, element);
      this.updateExcelColumnWidths(state.maxWidths, state.keys, element);
      row.commit();
    }
  }

  //------------------------------
  private async writeExcelReportInfoSheet(
    workbook: ExcelJS.stream.xlsx.WorkbookWriter,
    options: {
      title: string;
      rows: Array<{ label: string; value: string }>;
    },
  ) {
    const sheet = workbook.addWorksheet('Info', {
      properties: { defaultRowHeight: 18 },
    });

    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = options.title;
    titleCell.font = {
      bold: true,
      name: 'Calibri',
      size: 16,
      color: { argb: 'FF1F4E79' },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(1).height = 28;

    const headerRow = sheet.getRow(2);
    headerRow.getCell(1).value = 'Field';
    headerRow.getCell(2).value = 'Value';
    headerRow.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      name: 'Calibri',
      size: 11,
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.eachCell((cell: ExcelJS.Cell) => {
      cell.border = this.getExcelThinBorder();
    });
    headerRow.commit();

    options.rows.forEach((item, index) => {
      const row = sheet.getRow(index + 3);
      row.getCell(1).value = item.label;
      row.getCell(2).value = item.value;
      row.font = { name: 'Calibri', size: 10 };
      row.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEEF3F8' },
      };
      row.eachCell((cell: ExcelJS.Cell) => {
        cell.border = this.getExcelThinBorder();
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      row.commit();
    });

    const labelWidth = Math.min(
      36,
      Math.max(14, ...options.rows.map((row) => row.label.length + 4), 10),
    );
    const valueWidth = Math.min(
      60,
      Math.max(
        24,
        ...options.rows.map((row) => String(row.value).length + 4),
        options.title.length + 4,
      ),
    );
    sheet.getColumn(1).width = labelWidth;
    sheet.getColumn(2).width = valueWidth;
    sheet.commit();
  }

  //------------------------------
  async reportUserScopeFile(
    user: User,
    userRoles: Role[],
    body: assetSearchBodyReportExportExcelDto,
    res: Response,
    type: 'csv' | 'xls' | 'pdf',
  ) {
    const scopeQueryOptions = await this.resolveUserScopeQueryOptions(
      user,
      userRoles,
      'reportUserScopeFile',
    );

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

    const exportFilename = this.sanitizeExportFilename(
      assetType.name || 'asset-report',
    );

    let stream: CsvFormatterStream<Row, Row> | undefined = undefined;
    let workbook: ExcelJS.stream.xlsx.WorkbookWriter | undefined = undefined;
    let excelSheetState: ExcelReportSheetState | undefined = undefined;
    if (type === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${exportFilename}.csv"`,
      );
    } else if (type === 'xls') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${exportFilename}.xlsx"`,
      );

      workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: res,
        useStyles: true,
      });
    }

    let csvHeadersSet = false;
    let csvKeys: string[] = [];
    if (hasElasticSearch) {
      this.recursivelyFlatKeysOfSearch(elasticBody, '', elasticQuery);
    }

    if (type === 'xls' && workbook) {
      const infoRows: Array<{ label: string; value: string }> = [
        { label: 'Asset Type', value: assetType.name || '' },
      ];
      if (name) {
        infoRows.push({ label: 'Name', value: name });
      }
      if (externalRefId) {
        infoRows.push({ label: 'External Ref Id', value: externalRefId });
      }
      if (locationTypeId) {
        const locationType = await this.locationTypeRepository.findOne({
          where: { id: locationTypeId },
        });
        if (locationType) {
          infoRows.push({ label: 'Location Type', value: locationType.name });
        }
      }
      if (locationId) {
        const location = await this.locationRepository.findOne({
          where: { id: locationId },
        });
        if (location) {
          infoRows.push({ label: 'Location', value: location.name });
        }
      }
      infoRows.push(...this.collectElasticFilterRows(elasticQuery));

      await this.writeExcelReportInfoSheet(workbook, {
        title: assetType.name || 'Asset Report',
        rows: infoRows,
      });
      excelSheetState = this.createExcelReportSheetState(
        this.createExcelReportDataSheet(workbook, 'V1'),
      );
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
        ...scopeQueryOptions,
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

      if (type === 'csv') {
        if (csvHeadersSet) {
          for (const element of mappedData) {
            if (element) {
              const displayRow: Record<string, unknown> = {};
              for (const key of csvKeys) {
                displayRow[this.formatReportColumnHeader(key)] =
                  element[key] ?? '';
              }
              stream!.write(displayRow);
            }
          }
        }
      } else if (type === 'xls' && excelSheetState) {
        this.writeExcelReportRows(excelSheetState, mappedData);
      }

      if (
        (!hasElasticSearch && qb[0].length < 10000) ||
        (hasElasticSearch && (ids?.length || 0) < elasticsearchSize)
      ) {
        if (type === 'csv') {
          if (!csvHeadersSet) {
            csvKeys = this.collectReportColumnKeys(mappedData);
            stream = format({
              headers: csvKeys.map((key) => this.formatReportColumnHeader(key)),
              writeBOM: true,
              quoteHeaders: true,
              quoteColumns: true,
            });
            stream.pipe(res);
            sqlPage = 1;
            csvHeadersSet = true;
          } else {
            stream!.end();
            return;
          }
        } else if (type === 'xls' && workbook && excelSheetState) {
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
              this.finalizeExcelReportDataSheet(excelSheetState);
              excelSheetState.worksheet.commit();
              version++;
              excelSheetState = this.createExcelReportSheetState(
                this.createExcelReportDataSheet(workbook, `V${version}`),
              );
              elasticsearchPage = 1;
              sqlPage = 1;
              continue;
            }
          }

          this.finalizeExcelReportDataSheet(excelSheetState);
          excelSheetState.worksheet.commit();
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
    const scopeQueryOptions = await this.resolveUserScopeQueryOptions(
      user,
      userRoles,
      'reportUserScope',
    );

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
        ...scopeQueryOptions,
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
  private normalizeHrmsId(id: unknown): string | undefined {
    if (id === null || id === undefined) {
      return undefined;
    }

    const value = String(id).trim();
    return value.length > 0 ? value : undefined;
  }

  //------------------------------
  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  //------------------------------
  unwrapEmployeeList(payload: unknown): any[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      const data = (payload as { data?: unknown }).data;
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object') {
        const nested = (data as { data?: unknown }).data;
        if (Array.isArray(nested)) {
          return nested;
        }
      }
    }

    return [];
  }

  //------------------------------
  extractEmployeeScopeId(employee: any): string | undefined {
    const candidates = [employee?.idpUserId, employee?.IdpUserId];

    for (const candidate of candidates) {
      const value = this.normalizeHrmsId(candidate);
      if (value && this.isUuid(value)) {
        return value;
      }
    }

    return undefined;
  }

  //------------------------------
  private toAdUserName(username: string): string {
    if (!username) {
      return username;
    }

    return username.includes('\\') ? username : `iranet\\${username}`;
  }

  //------------------------------
  private async getIdpConfig() {
    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');
    return { IDP_SERVICE_INTERNAL_TOKEN, IDP_SERVICE_URL };
  }

  //------------------------------
  private async fetchEmployeesInternal(
    params: Record<string, unknown> = {},
    traceId?: string,
  ): Promise<any[]> {
    const logTraceId = traceId || this.createUserScopeTraceId();
    const { IDP_SERVICE_INTERNAL_TOKEN, IDP_SERVICE_URL } =
      await this.getIdpConfig();
    const url = `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`;
    const requestParams = { GetInternalUsers: true, ...params };

    this.logUserScope(logTraceId, 'idp.employees.request', {
      url,
      params: requestParams,
    });

    const startedAt = Date.now();
    try {
      const { data, status } = await axios.get(url, {
        params: requestParams,
        headers: {
          'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
          accept: '*/*',
        },
      });
      const employees = this.unwrapEmployeeList(data);
      this.logUserScope(logTraceId, 'idp.employees.response', {
        url,
        params: requestParams,
        status,
        durationMs: Date.now() - startedAt,
        payloadShape: this.describePayloadShape(data),
        employees: this.summarizeEmployees(employees),
      });
      return employees;
    } catch (error: any) {
      this.logUserScope(logTraceId, 'idp.employees.error', {
        url,
        params: requestParams,
        durationMs: Date.now() - startedAt,
        status: error?.response?.status,
        message: error?.message,
      });
      throw error;
    }
  }

  //------------------------------
  private async resolveEmployeesToUserIds(
    employees: any[],
    traceId?: string,
  ): Promise<string[]> {
    const logTraceId = traceId || this.createUserScopeTraceId();
    const ids = new Set<string>();
    const employeeIdsToResolve = new Set<string>();
    let extractedCount = 0;

    this.logUserScope(logTraceId, 'resolve-ids.start', {
      employees: this.summarizeEmployees(employees),
    });

    for (const employee of employees) {
      const scopeId = this.extractEmployeeScopeId(employee);
      if (scopeId) {
        ids.add(scopeId);
        extractedCount += 1;
        continue;
      }

      const employeeId = this.normalizeHrmsId(employee?.EmployeeId);
      if (employeeId) {
        employeeIdsToResolve.add(employeeId);
      }
    }

    this.logUserScope(logTraceId, 'resolve-ids.extracted', {
      extractedCount,
      uniqueIdpUserIds: Array.from(ids),
      missingIdpUserIdCount: employeeIdsToResolve.size,
      employeeIdsToResolve: Array.from(employeeIdsToResolve),
    });

    if (employeeIdsToResolve.size > 0) {
      const { IDP_SERVICE_INTERNAL_TOKEN, IDP_SERVICE_URL } =
        await this.getIdpConfig();
      const employeeIds = Array.from(employeeIdsToResolve);
      const CHUNK_SIZE = 10;
      const url = `${IDP_SERVICE_URL}/idp/api/v1/users`;

      for (let i = 0; i < employeeIds.length; i += CHUNK_SIZE) {
        const chunk = employeeIds.slice(i, i + CHUNK_SIZE);
        this.logUserScope(logTraceId, 'idp.users.request', {
          url,
          employeeIds: chunk,
        });
        const startedAt = Date.now();
        const resolved = await Promise.all(
          chunk.map(async (employeeId) => {
            try {
              const { data } = await axios.post(
                url,
                { domain: 'iranet', employeeId },
                {
                  headers: {
                    'x-internal-communication-token':
                      IDP_SERVICE_INTERNAL_TOKEN,
                  },
                },
              );
              const userId = this.normalizeHrmsId(data?.data?.id);
              const resolvedId =
                userId && this.isUuid(userId) ? userId : undefined;
              this.logUserScope(logTraceId, 'idp.users.response', {
                employeeId,
                resolvedUserId: resolvedId ?? null,
              });
              return resolvedId;
            } catch (error: any) {
              this.logUserScope(logTraceId, 'idp.users.error', {
                employeeId,
                status: error?.response?.status,
                message: error?.message,
              });
              return undefined;
            }
          }),
        );
        this.logUserScope(logTraceId, 'idp.users.chunk-done', {
          durationMs: Date.now() - startedAt,
          resolvedCount: resolved.filter(Boolean).length,
        });

        for (const userId of resolved) {
          if (userId) {
            ids.add(userId);
          }
        }
      }
    }

    const result = Array.from(ids);
    this.logUserScope(logTraceId, 'resolve-ids.done', {
      count: result.length,
      userIds: result,
    });
    return result;
  }

  //------------------------------
  async getSubordinateUsers(
    username: string,
    traceId?: string,
  ): Promise<string[]> {
    const logTraceId = traceId || this.createUserScopeTraceId();
    this.logUserScope(logTraceId, 'subordinates.start', { username });

    const { IDP_SERVICE_INTERNAL_TOKEN, IDP_SERVICE_URL } =
      await this.getIdpConfig();

    const currentUsers = await this.fetchEmployeesInternal(
      {
        ADUserName: this.toAdUserName(username),
      },
      logTraceId,
    );
    const currentUser = currentUsers[0];

    if (!currentUser) {
      this.logUserScope(logTraceId, 'subordinates.current-user-missing', {
        username,
        adUserName: this.toAdUserName(username),
      });
      throw new BadRequestException('User not found in IDP');
    }

    const userId = this.normalizeHrmsId(currentUser.EmployeeId);
    this.logUserScope(logTraceId, 'subordinates.current-user', {
      username,
      currentUser: this.summarizeEmployees([currentUser]).people[0],
      employeeId: userId ?? null,
    });
    if (!userId) {
      throw new BadRequestException('EmployeeId not found for user');
    }

    let allUsers: any[] = [];
    try {
      allUsers = await this.fetchEmployeesInternal({}, logTraceId);
    } catch (error: any) {
      this.logUserScope(logTraceId, 'subordinates.all-employees-failed', {
        message: error?.message,
      });
      console.error(
        'Failed to fetch all employees for subordinate scope',
        error,
      );
    }

    const currentDepartmentId = this.normalizeHrmsId(currentUser.DepartmentId);
    this.logUserScope(logTraceId, 'subordinates.department-walk.start', {
      currentDepartmentId: currentDepartmentId ?? null,
    });
    const allDepartmentIds = currentDepartmentId
      ? await this.getAllSubordinateDepartmentIds(
          currentDepartmentId,
          IDP_SERVICE_URL,
          IDP_SERVICE_INTERNAL_TOKEN,
          logTraceId,
        )
      : [];
    this.logUserScope(logTraceId, 'subordinates.department-walk.done', {
      departmentIds: allDepartmentIds,
      count: allDepartmentIds.length,
    });

    if (allUsers.length === 0 && allDepartmentIds.length > 0) {
      this.logUserScope(logTraceId, 'subordinates.fallback-department-users', {
        departmentIds: allDepartmentIds,
      });
      allUsers = await this.getUsersFromDepartments(
        allDepartmentIds,
        IDP_SERVICE_URL,
        IDP_SERVICE_INTERNAL_TOKEN,
        logTraceId,
      );
    }

    const managedUsers = this.getAllManagedUsers(
      userId,
      allUsers,
      logTraceId,
    );
    this.logUserScope(logTraceId, 'subordinates.reporting-line', {
      managerEmployeeId: userId,
      inputUserCount: allUsers.length,
      managedUsers: this.summarizeEmployees(managedUsers, 200),
    });

    const departmentIdSet = new Set(
      allDepartmentIds
        .map((id) => this.normalizeHrmsId(id))
        .filter((id): id is string => !!id),
    );
    const departmentUsers = allUsers.filter((employee) => {
      const departmentId = this.normalizeHrmsId(employee?.DepartmentId);
      return !!departmentId && departmentIdSet.has(departmentId);
    });
    this.logUserScope(logTraceId, 'subordinates.department-users', {
      departmentUsers: this.summarizeEmployees(departmentUsers, 200),
    });

    const result = await this.resolveEmployeesToUserIds(
      [...managedUsers, ...departmentUsers],
      logTraceId,
    );
    this.logUserScope(logTraceId, 'subordinates.done', {
      username,
      count: result.length,
      userIds: result,
    });
    return result;
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
  private async getCurrentUserIpdUser(username: string, traceId?: string) {
    const logTraceId = traceId || this.createUserScopeTraceId();
    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');
    const url = `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`;
    const params = {
      ADUserName: this.toAdUserName(username),
      GetInternalUsers: true,
    };

    this.logUserScope(logTraceId, 'idp.current-user.request', { url, params });
    const startedAt = Date.now();
    const { data, status } = await axios.get(url, {
      params,
      headers: {
        'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
        accept: '*/*',
      },
    });
    const currentUser = this.unwrapEmployeeList(data)[0] ?? null;
    this.logUserScope(logTraceId, 'idp.current-user.response', {
      status,
      durationMs: Date.now() - startedAt,
      payloadShape: this.describePayloadShape(data),
      currentUser: currentUser
        ? this.summarizeEmployees([currentUser]).people[0]
        : null,
    });

    return currentUser;
  }

  //------------------------------
  async getAllSubordinateDepartmentIds(
    departmentId: string,
    IDP_SERVICE_URL: string,
    IDP_SERVICE_INTERNAL_TOKEN: string,
    traceId?: string,
  ): Promise<string[]> {
    const logTraceId = traceId || this.createUserScopeTraceId();
    if (!departmentId?.trim()) {
      this.logUserScope(logTraceId, 'departments.skip-empty-id', {});
      return [];
    }

    const visited = new Set<string>();
    const queue: string[] = [departmentId];
    visited.add(departmentId);
    this.logUserScope(logTraceId, 'departments.start', { departmentId });

    while (queue.length > 0) {
      const currentLevel = [...queue];
      queue.length = 0;

      const fetchPromises = currentLevel.map(async (parentId) => {
        const url = `${IDP_SERVICE_URL}/idp/api/v1/auth/get-downward-department-internal/${encodeURIComponent(parentId)}`;
        this.logUserScope(logTraceId, 'idp.downward-department.request', {
          url,
          parentId,
        });
        const startedAt = Date.now();
        try {
          const response = await axios.get(url, {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
              Accept: 'application/json',
            },
          });

          const rawData = this.unwrapEmployeeList(response.data);
          this.logUserScope(logTraceId, 'idp.downward-department.response', {
            parentId,
            status: response.status,
            durationMs: Date.now() - startedAt,
            payloadShape: this.describePayloadShape(response.data),
            childCount: rawData.length,
            children: rawData.slice(0, 40).map((dept: any) => ({
              departmentId:
                dept?.departmentId ?? dept?.DepartmentId ?? dept?.id ?? null,
              departmentName:
                dept?.departmentName ?? dept?.DepartmentName ?? null,
            })),
          });

          if (!Array.isArray(rawData) || rawData.length === 0) {
            return [];
          }

          const rawChildIds = rawData
            .map((dept: any) =>
              this.normalizeHrmsId(
                dept?.departmentId ?? dept?.DepartmentId ?? dept?.id,
              ),
            )
            .filter((id: string | undefined): id is string => {
              if (!id) {
                return false;
              }
              if (visited.has(id)) {
                return false;
              }
              return true;
            });
          const newChildren = rawChildIds;

          return newChildren;
        } catch (error: any) {
          this.logUserScope(logTraceId, 'idp.downward-department.error', {
            parentId,
            durationMs: Date.now() - startedAt,
            status: error?.response?.status,
            message: error?.message,
          });
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
    this.logUserScope(logTraceId, 'departments.done', {
      count: result.length,
      departmentIds: result,
    });
    return result;
  }

  //------------------------------
  async getUsersFromDepartments(
    departmentIds: string[],
    IDP_SERVICE_URL: string,
    IDP_SERVICE_INTERNAL_TOKEN: string,
    traceId?: string,
  ): Promise<any[]> {
    const logTraceId = traceId || this.createUserScopeTraceId();
    if (!departmentIds || departmentIds.length === 0) {
      this.logUserScope(logTraceId, 'department-users.skip-empty', {});
      return [];
    }

    const uniqueDeptIds = [...new Set(departmentIds)];
    this.logUserScope(logTraceId, 'department-users.start', {
      departmentIds: uniqueDeptIds,
    });

    const CHUNK_SIZE = 5;
    const allUsers: any[] = [];

    for (let i = 0; i < uniqueDeptIds.length; i += CHUNK_SIZE) {
      const chunk = uniqueDeptIds.slice(i, i + CHUNK_SIZE);

      const promises = chunk.map(async (deptId) => {
        const url = `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal-without-paginate`;
        const params = { DepartmentId: deptId, GetInternalUsers: true };
        this.logUserScope(logTraceId, 'idp.department-employees.request', {
          url,
          params,
        });
        const startedAt = Date.now();
        try {
          const { data: response, status } = await axios.get(url, {
            params,
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
              accept: '*/*',
            },
          });

          const users = this.unwrapEmployeeList(response);
          this.logUserScope(logTraceId, 'idp.department-employees.response', {
            params,
            status,
            durationMs: Date.now() - startedAt,
            payloadShape: this.describePayloadShape(response),
            employees: this.summarizeEmployees(users),
          });
          return users;
        } catch (err: any) {
          this.logUserScope(logTraceId, 'idp.department-employees.error', {
            params,
            durationMs: Date.now() - startedAt,
            status: err?.response?.status,
            message: err?.message,
          });
          console.log(err);
          return [];
        }
      });

      const chunkResults = await Promise.all(promises);
      const flattened = chunkResults.flat();
      allUsers.push(...flattened);
    }

    this.logUserScope(logTraceId, 'department-users.done', {
      count: allUsers.length,
      employees: this.summarizeEmployees(allUsers, 80),
    });
    return allUsers;
  }

  //------------------------------
  public async buildSupervisorScope(
    username: string,
    authenticatedUserId?: string,
    traceId?: string,
  ): Promise<string[]> {
    const logTraceId = traceId || this.createUserScopeTraceId();
    this.logUserScope(logTraceId, 'supervisor-scope.start', {
      username,
      authenticatedUserId: authenticatedUserId ?? null,
    });

    const currentUserInfo = await this.getCurrentUserIpdUser(
      username,
      logTraceId,
    );
    const currentUserIpdUserId = this.extractEmployeeScopeId(currentUserInfo);
    this.logUserScope(logTraceId, 'supervisor-scope.current-idp-user', {
      currentUserIpdUserId: currentUserIpdUserId ?? null,
      currentUser: currentUserInfo
        ? this.summarizeEmployees([currentUserInfo]).people[0]
        : null,
    });

    const subordinateUsers = await this.getSubordinateUsers(
      username,
      logTraceId,
    );
    const authenticatedId = this.normalizeHrmsId(authenticatedUserId);
    const baseScope = [
      ...(authenticatedId && this.isUuid(authenticatedId)
        ? [authenticatedId]
        : []),
      ...(currentUserIpdUserId ? [currentUserIpdUserId] : []),
      ...subordinateUsers,
    ];

    const result = [...new Set(baseScope)];
    this.logUserScope(logTraceId, 'supervisor-scope.done', {
      username,
      count: result.length,
      userIds: result,
    });
    return result;

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
  public async buildAssetUserScope(
    username: string,
    authenticatedUserId?: string,
    traceId?: string,
  ): Promise<string[]> {
    const logTraceId = traceId || this.createUserScopeTraceId();
    this.logUserScope(logTraceId, 'asset-user-scope.start', {
      username,
      authenticatedUserId: authenticatedUserId ?? null,
    });
    const scopeIds = await this.getAssetUserScopeIds(username, logTraceId);
    const authenticatedId = this.normalizeHrmsId(authenticatedUserId);

    const result =
      authenticatedId && this.isUuid(authenticatedId)
        ? [...new Set([authenticatedId, ...scopeIds])]
        : scopeIds;

    this.logUserScope(logTraceId, 'asset-user-scope.done', {
      username,
      count: result.length,
      userIds: result,
    });
    return result;
  }

  //------------------------------
  getAllManagedUsers(
    userId: string,
    allUsers: any[],
    traceId?: string,
  ): any[] {
    const logTraceId = traceId || this.createUserScopeTraceId();
    const normalizedUserId = this.normalizeHrmsId(userId);
    if (
      !Array.isArray(allUsers) ||
      allUsers.length === 0 ||
      !normalizedUserId
    ) {
      this.logUserScope(logTraceId, 'managed-users.skip', {
        managerEmployeeId: normalizedUserId ?? null,
        inputUserCount: Array.isArray(allUsers) ? allUsers.length : 0,
      });
      return [];
    }

    const employeeMap = new Map<string, any>();
    const reportsMap = new Map<string, any[]>();

    for (const user of allUsers) {
      const empId = this.normalizeHrmsId(user?.EmployeeId);
      const mgrId = this.normalizeHrmsId(user?.ManagerId);

      if (empId) employeeMap.set(empId, user);
      if (mgrId) {
        if (!reportsMap.has(mgrId)) reportsMap.set(mgrId, []);
        reportsMap.get(mgrId)!.push(user);
      }
    }

    const managedUsers: any[] = [];
    const visited = new Set<string>();
    const queue: string[] = [];

    const directReports = reportsMap.get(normalizedUserId) || [];
    for (const report of directReports) {
      const id = this.normalizeHrmsId(report?.EmployeeId);
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
        const reportId = this.normalizeHrmsId(report?.EmployeeId);
        if (reportId && !visited.has(reportId)) {
          visited.add(reportId);
          queue.push(reportId);
        }
      }
    }

    this.logUserScope(logTraceId, 'managed-users.tree', {
      managerEmployeeId: normalizedUserId,
      inputUserCount: allUsers.length,
      employeeMapSize: employeeMap.size,
      managersWithReports: reportsMap.size,
      directReportCount: directReports.length,
      managedCount: managedUsers.length,
      managedUsers: this.summarizeEmployees(managedUsers, 80),
    });

    return managedUsers;
  }

  //------------------------------
  async getAssetUserScopeIds(
    username: string,
    traceId?: string,
  ): Promise<string[]> {
    const logTraceId = traceId || this.createUserScopeTraceId();
    try {
      this.logUserScope(logTraceId, 'asset-user-ids.start', { username });
      const currentUsers = await this.fetchEmployeesInternal(
        {
          ADUserName: this.toAdUserName(username),
        },
        logTraceId,
      );
      const currentUser = currentUsers[0];

      if (!currentUser) {
        this.logUserScope(logTraceId, 'asset-user-ids.current-user-missing', {
          username,
        });
        throw new BadRequestException('User not found in IDP');
      }

      const currentDepartmentId = this.normalizeHrmsId(
        currentUser.DepartmentId,
      );
      const currentUserEmployeeId = this.normalizeHrmsId(
        currentUser.EmployeeId,
      );
      const currentUserManagerId = this.normalizeHrmsId(currentUser.ManagerId);

      this.logUserScope(logTraceId, 'asset-user-ids.current-user', {
        currentUser: this.summarizeEmployees([currentUser]).people[0],
        currentDepartmentId: currentDepartmentId ?? null,
        currentUserEmployeeId: currentUserEmployeeId ?? null,
        currentUserManagerId: currentUserManagerId ?? null,
      });

      if (!currentDepartmentId) {
        throw new BadRequestException('Required user information not found');
      }

      const departmentUsers = await this.fetchEmployeesInternal(
        {
          DepartmentId: currentDepartmentId,
        },
        logTraceId,
      );
      const managedUsers = currentUserEmployeeId
        ? this.getAllManagedUsers(
            currentUserEmployeeId,
            departmentUsers,
            logTraceId,
          )
        : [];
      this.logUserScope(logTraceId, 'asset-user-ids.department-and-reports', {
        departmentUsers: this.summarizeEmployees(departmentUsers, 80),
        managedUsers: this.summarizeEmployees(managedUsers, 80),
      });

      const scopeEmployees = [...departmentUsers, ...managedUsers, currentUser];

      if (currentUserManagerId) {
        const managerUsers = await this.fetchEmployeesInternal(
          {
            EmployeeId: currentUserManagerId,
          },
          logTraceId,
        );
        this.logUserScope(logTraceId, 'asset-user-ids.manager', {
          managerUsers: this.summarizeEmployees(managerUsers),
        });
        scopeEmployees.push(...managerUsers);
      }

      const scopeIds = await this.resolveEmployeesToUserIds(
        scopeEmployees,
        logTraceId,
      );
      this.logUserScope(logTraceId, 'asset-user-ids.done', {
        count: scopeIds.length,
        userIds: scopeIds,
      });
      if (scopeIds.length === 0) {
        throw new BadRequestException('Required user information not found');
      }

      return scopeIds;
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logUserScope(logTraceId, 'asset-user-ids.error', {
        message: (err as Error)?.message,
      });
      console.log(err);
      throw new InternalServerErrorException('');
    }
  }

  //------------------------------
  async getLastWeekAssetVersions(user: User | any, userRoles: Role[]) {
    const queryOptions = await this.resolveUserScopeQueryOptions(
      user,
      userRoles,
      'getLastWeekAssetVersions',
    );

    return await this.assetVersionRepository.getLastWeekAssetVersions(
      queryOptions,
    );
  }

  //------------------------------
  async getAccessibleAssets(user: User | any, userRoles: Role[]) {
    const queryOptions = await this.resolveUserScopeQueryOptions(
      user,
      userRoles,
      'getAccessibleAssets',
    );

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
    const queryOptions = await this.resolveUserScopeQueryOptions(
      user,
      userRoles,
      'getAccessibleAssetsByTypes',
    );

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
    const queryOptions = await this.resolveUserScopeQueryOptions(
      user,
      userRoles,
      'getAccessibleAssetVersionResponsibilityCounts',
    );

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
        this.assetVersionRepository.findAndDelete({ id });
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
