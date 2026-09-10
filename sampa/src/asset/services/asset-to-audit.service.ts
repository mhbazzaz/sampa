import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { I18nService } from 'nestjs-i18n';
import {
  AssetCategoryInterface,
  AssetTypeInterface,
} from 'src/common/interfaces/get-asset-retreival.interface';
import { Member } from 'src/member/entities/member.entity';
import { Vault } from 'src/vault/vault';
import { DeepPartial, FindOneOptions, FindOptionsWhere, Like } from 'typeorm';
import { AssetRetrievalArrayDto } from '../dto/input/asset-retrieval.dto';
import { FindAllAssetQueryDto } from '../dto/input/get-asset-filtered-query-params.dto';
import { GetAssetsGroupedVersionsDTO } from '../dto/input/get-assets-grouped-versions.dto';
import { GetAssetsGroupedDTO } from '../dto/input/get-assets-grouped.dto';
import { AssetToAudit } from '../entities/asset-to-audit.entity';
import { AssetType } from '../entities/asset-type.entity';
import { AssetRepository } from '../repositories/asset-to-audit.repository';
import { AssetTypeService } from './asset-type.service';

@Injectable()
export class AssetService {
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly assetTypeService: AssetTypeService,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(data: DeepPartial<AssetToAudit>): Promise<AssetToAudit> {
    return this.assetRepository.save(data);
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<AssetToAudit>,
  ): Promise<AssetToAudit | null> {
    return this.assetRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.assetRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<AssetToAudit>,
    updateAsset: Partial<AssetToAudit>,
  ) {
    return this.assetRepository.update(data, updateAsset);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<AssetToAudit>) {
    return this.assetRepository.findAndDelete(data);
  }

  //------------------------------
  async getAssetsGrouped(query: GetAssetsGroupedDTO, member: Member) {
    return this.assetRepository.getAssetsGrouped(query, member);
  }

  //------------------------------
  async getAssetsGroupedVersions(
    query: GetAssetsGroupedVersionsDTO,
    member: Member,
  ) {
    return this.assetRepository.getAssetsGroupedVersions(query, member);
  }

  //------------------------------
  async findAllPagination(query: FindAllAssetQueryDto) {
    return this.assetRepository.findAllPagination(query.skip, query.take, {
      where: {
        referenceId: query.referenceId ? query.referenceId : undefined,
        title: query.title ? Like(`%${query.title}%`) : undefined,
      },
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  // async getAssetsForGroupLead(userId: string): Promise<AssetResponse[]> {
  //   const assets = await this.assetRepository.getAssetsForGroupLead(userId);

  //   if (!assets.length)
  //     throw new SampaHttpException(SampaEnumErrors.ERROR_NOT_FOUND_ASSETS);

  //   const result: AssetResponse[] = assets.map((asset) => {
  //     const membersId = new Set<string>();

  //     asset.group?.forEach((group) => {
  //       group.groupMembership?.forEach((membership) => {
  //         if (membership.isMember) {
  //           membersId.add(membership.user?.id ?? '');
  //         }
  //       });
  //     });

  //     return {
  //       assetReferenceId: asset.id,
  //       title: asset.title,
  //       leadId: userId,
  //       membersId: Array.from(membersId),
  //     };
  //   });

  //   return result;
  // }

  //------------------------------
  async getAssetInfo(assetName: string) {
    const foundAsset = await this.assetRepository.findOne({
      where: { title: assetName },
      relations: [
        'group',
        'group.groupMembership',
        'group.groupMembership.user',
      ],
    });

    if (!foundAsset) {
      throw new NotFoundException(
        this.i18nService.t('messages.ERROR_ASSET_NOT_FOUND'),
      );
    }

    const leadInfo = (foundAsset.group || [])
      .filter((group) => group.groupMembership)
      .map((group) =>
        (group.groupMembership || [])
          .filter((membership) => membership.isLead && membership.user)
          .map((membership) => ({
            id: membership.userId,
            firstName: membership.user?.firstName,
            lastName: membership.user?.lastName,
          })),
      )
      .reduce((acc, leads) => acc.concat(leads), []);

    return {
      assetId: foundAsset.id,
      assetTitle: foundAsset.title,
      assetEnvironmentTitle: foundAsset.title,
      applicantManager: leadInfo,
    };
  }

  //------------------------------
  async assetRetrieval(
    data: AssetRetrievalArrayDto,
    cookie: string | undefined,
  ) {
    const { dataList } = data;

    const createdAssets: AssetToAudit[] = [];
    const createdAssetTypes: AssetType[] = [];

    const inputAssetTypeIds: { id: string }[] = [];

    const ASSET_MANAGEMENT_SERVICE_URL = await Vault.instance.get(
      'ASSET_MANAGEMENT_SERVICE_URL',
      'sampa-service',
    );

    for (const data of dataList) {
      const { assetTypeIds = [] } = data;

      for (const assetTypeId of assetTypeIds) {
        try {
          inputAssetTypeIds.push({ id: assetTypeId });

          const { data } = await axios.get(
            `${ASSET_MANAGEMENT_SERVICE_URL}/asset-management/api/v1/admin/asset-type/${assetTypeId}`,
            {
              headers: {
                Cookie: cookie,
              },
            },
          );

          if (data?.data) {
            const assetCategory: Partial<AssetCategoryInterface> = {
              name: data.data.assetCategory.name,
              id: data.data.assetCategory.id,
            };

            const assetType: Partial<AssetTypeInterface> = {
              name: data.data.name,
              code: data.data.code,
              assetCategoryId: data.data.assetCategoryId,
              id: assetTypeId,
            };

            const processedType =
              await this.assetTypeService.processGroupedAssetType(
                assetType,
                assetCategory,
              );
            createdAssetTypes.push(processedType);
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            if (error.response) {
              throw new BadRequestException(error.response.data.message);
            }
            throw error;
          }
        }
      }
    }

    const existingAssetTypes = await this.assetTypeService.getAllAssetTypes();

    const indices = this.getMissingIndices(
      existingAssetTypes,
      inputAssetTypeIds,
    );

    for (const index of indices) {
      await Promise.all([
        this.assetRepository.findAndDelete({
          assetType: { id: existingAssetTypes[index].id },
        }),
        this.assetTypeService.remove({
          id: existingAssetTypes[index].id,
        }),
      ]);
    }

    return { createdAssets, createdAssetTypes };
  }

  //------------------------------
  getMissingIndices(
    existingAssetTypes: { id: string }[],
    inputAssetTypeIds: { id: string }[],
  ): number[] {
    const inputIdsSet = new Set(inputAssetTypeIds.map((item) => item.id));

    return existingAssetTypes
      .map((item, index) => (inputIdsSet.has(item.id) ? -1 : index))
      .filter((index) => index !== -1);
  }

  // //------------------------------
  // private groupAssetsByCategoryAndType(assets: AssetInterface[]): {
  //   assetCategory: AssetCategoryInterface;
  //   assetType: AssetTypeInterface;
  //   assets: AssetInterface[];
  // }[] {
  //   const groupedMap = new Map<
  //     string,
  //     {
  //       assetCategory: AssetCategoryInterface;
  //       assetType: AssetTypeInterface;
  //       assets: AssetInterface[];
  //     }
  //   >();

  //   for (const asset of assets) {
  //     if (!asset.assetType || !asset.assetType.assetCategory) {
  //       continue;
  //     }

  //     const assetType = asset.assetType;
  //     const assetCategory = asset.assetType.assetCategory;

  //     const groupKey = `${assetCategory.id}-${assetType.id}`;

  //     if (!groupedMap.has(groupKey)) {
  //       groupedMap.set(groupKey, {
  //         assetCategory,
  //         assetType,
  //         assets: [],
  //       });
  //     }

  //     groupedMap.get(groupKey)!.assets.push(asset);
  //   }

  //   const groupedAssets = Array.from(groupedMap.values());
  //   return groupedAssets;
  // }

  // //------------------------------
  // private async processGroupedAssets(
  //   groupedAssets: {
  //     assetCategory: AssetCategoryInterface;
  //     assetType: AssetTypeInterface;
  //     assets: AssetInterface[];
  //   }[],
  // ) {
  //   for (const group of groupedAssets) {
  //     const { assetCategory, assetType, assets } = group;

  //     const assetCategoryData: Partial<AssetCategory> = {
  //       name: assetCategory.name,
  //     };

  //     const assetTypeData: Partial<AssetType> = {
  //       name: assetType.name,
  //       assetCategoryId: assetCategory.id,
  //     };

  //     for (const asset of assets) {
  //       const assetToAuditData: Partial<AssetToAudit> = {
  //         title: asset.name,
  //         baseline: asset.baseline,
  //         referenceId: asset.referenceId,
  //       };

  //       await this.assetRepository.assetRetrievalTransactional(
  //         assetToAuditData,
  //         assetTypeData,
  //         assetCategoryData,
  //       );
  //     }
  //   }

  //   return true;
  // }
}
