import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Member } from 'src/member/entities/member.entity';
import { Vault } from 'src/vault/vault';
import { DataSource, Repository } from 'typeorm';
import { GetAssetsGroupedVersionsDTO } from '../dto/input/get-assets-grouped-versions.dto';
import { GetAssetsGroupedDTO } from '../dto/input/get-assets-grouped.dto';
import { AssetCategory } from '../entities/asset-category.entity';
import { AssetToAudit } from '../entities/asset-to-audit.entity';
import { AssetType } from '../entities/asset-type.entity';

@Injectable()
export class AssetRepository extends AbstractRepository<AssetToAudit> {
  constructor(
    @InjectRepository(AssetToAudit)
    private assetRepository: Repository<AssetToAudit>,
    @InjectRepository(AssetType)
    private readonly assetTypeRepository: Repository<AssetType>,
    @InjectRepository(AssetCategory)
    private readonly assetCategoryRepository: Repository<AssetCategory>,
    private readonly dataSource: DataSource,
    private i18nService: I18nService,
  ) {
    super(assetRepository, i18nService);
  }

  //------------------------------
  async getAssetsForGroupLead(userId: string): Promise<AssetToAudit[]> {
    return await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoin('asset.group', 'group')
      .leftJoin('group.groupMembership', 'groupMembership')
      .where('groupMembership.userId = :userId', { userId })
      .andWhere('groupMembership.isLead = :isLead', { isLead: true })
      .getMany();
  }

  //------------------------------
  async assetRetrievalTransactional(
    assetToAuditData: Partial<AssetToAudit>,
    assetTypeData: Partial<AssetType>,
    assetCategoryData: Partial<AssetCategory>,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let assetCategory = await queryRunner.manager.findOne(AssetCategory, {
        where: { name: assetCategoryData.name },
      });

      if (!assetCategory) {
        assetCategory = queryRunner.manager.create(
          AssetCategory,
          assetCategoryData,
        );
        await queryRunner.manager.save(assetCategory);
      }

      let assetType = await queryRunner.manager.findOne(AssetType, {
        where: { name: assetTypeData.name },
      });

      if (!assetType) {
        assetType = queryRunner.manager.create(AssetType, {
          ...assetTypeData,
          assetCategory,
        });
        await queryRunner.manager.save(assetType);
      }

      // let assetToAudit = await queryRunner.manager.findOne(AssetToAudit, {
      //   where: { title: assetToAuditData.title },
      // });

      // if (!assetToAudit) {
      //   assetToAudit = queryRunner.manager.create(AssetToAudit, {
      //     ...assetToAuditData,
      //     assetType,
      //   });
      //   await queryRunner.manager.save(assetToAudit);
      // }

      await queryRunner.commitTransaction();

      // return assetToAudit;
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log('Transaction failed:', error);

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAssetsGrouped(query: GetAssetsGroupedDTO, member: Member) {
    const data = await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.assetTypeId = :assetTypeId', {
        assetTypeId: query.assetTypeId,
      })
      .leftJoinAndSelect('asset.group', 'group')
      .leftJoinAndSelect('group.groupMembership', 'groupMembership')
      .andWhere('groupMembership.userId = :userId', {
        userId: member.id,
      })
      .distinctOn(['asset.referenceId'])
      .orderBy('asset.referenceId', 'DESC')
      .offset(query.skip)
      .limit(query.take)
      .execute();

    type ArrayOfAssetsType = Partial<AssetToAudit> & {
      child: Partial<AssetToAudit>[];
    };
    const arrayOfAssets: ArrayOfAssetsType[] = [];

    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      arrayOfAssets.push({
        id: element['asset_id'],
        assetTypeId: element['asset_assetTypeId'],
        referenceId: element['asset_referenceId'],
        title: element['asset_title'],
        child: [],
      });
    }

    // const related = await this.assetRepository
    //   .createQueryBuilder('asset')
    //   .where('asset.referenceId IN (:...referenceIds)', {
    //     referenceIds: data.map((data: any) => data.asset_referenceId),
    //   })
    //   .execute();

    // const arrayOfRelatedAssets: Partial<AssetToAudit>[] = [];

    // for (let i = 0; i < related.length; i++) {
    //   const element = related[i];
    //   arrayOfRelatedAssets.push({
    //     id: element['asset_id'],
    //     assetTypeId: element['asset_assetTypeId'],
    //     referenceId: element['asset_referenceId'],
    //     title: element['asset_title'],
    //   });
    // }

    return arrayOfAssets;
  }

  async getAssetsGroupedVersions(
    query: GetAssetsGroupedVersionsDTO,
    member: Member,
  ) {
    const asset = await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.referenceId = :referenceId', {
        referenceId: query.assetReferenceId,
      })
      .leftJoinAndSelect('asset.group', 'group')
      .leftJoinAndSelect('group.groupMembership', 'groupMembership')
      .andWhere('groupMembership.userId = :userId', {
        userId: member.id,
      })
      .getOne();

    if (!asset) {
      throw new ForbiddenException('');
    }

    const ASSET_MANAGEMENT_SERVICE_URL = await Vault.instance.get(
      'ASSET_MANAGEMENT_SERVICE_URL',
    );

    const ASSET_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'ASSET_SERVICE_INTERNAL_TOKEN',
      'share',
    );

    const { data } = await axios.get(
      `${ASSET_MANAGEMENT_SERVICE_URL}/asset-management/api/v1/asset/archives-for-sampa/${asset.referenceId}?skip=0&take=100`,
      {
        headers: {
          'x-internal-communication-token': ASSET_SERVICE_INTERNAL_TOKEN,
        },
      },
    );

    return data.data;
  }
}
