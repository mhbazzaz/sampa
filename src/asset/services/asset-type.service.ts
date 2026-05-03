import { Injectable } from '@nestjs/common';
import {
  AssetCategoryInterface,
  AssetTypeInterface,
} from 'src/common/interfaces/get-asset-retreival.interface';
import { GroupMembershipRepository } from 'src/group-membership/repositories/group-membership.repository';
import { Member } from 'src/member/entities/member.entity';
import { DeepPartial, FindOneOptions, FindOptionsWhere, In } from 'typeorm';
import { AssetType } from '../entities/asset-type.entity';
import { AssetTypeRepository } from '../repositories/asset-type.repository';

@Injectable()
export class AssetTypeService {
  constructor(
    private readonly assetTypeRepository: AssetTypeRepository,
    private readonly groupMembershipRepository: GroupMembershipRepository,
  ) {}

  //------------------------------
  async create(data: DeepPartial<AssetType>): Promise<AssetType> {
    return this.assetTypeRepository.save(data);
  }

  //------------------------------
  async findOne(data: FindOneOptions<AssetType>): Promise<AssetType | null> {
    return this.assetTypeRepository.findOne(data);
  }

  //------------------------------
  async findOneUserScope(
    id: string,
    member: Member,
  ): Promise<AssetType | null> {
    const groups = await this.groupMembershipRepository.findAll({
      where: { userId: member.id },
      select: { groupId: true },
    });

    return this.assetTypeRepository.findOne({
      where: {
        id,
        assetToAudit: {
          group: { id: In(groups.map((group) => group.groupId)) },
        },
      },
      relations: { assetToAudit: true },
    });
  }

  //------------------------------
  async findAll() {
    return this.assetTypeRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<AssetType>,
    updateAsset: Partial<AssetType>,
  ) {
    return this.assetTypeRepository.update(data, updateAsset);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<AssetType>) {
    return this.assetTypeRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.assetTypeRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async findAllScopeInternal() {
    return this.assetTypeRepository.findAll();
  }

  //------------------------------
  async getAllAssetTypes() {
    const allAssetTypes = await this.assetTypeRepository.findAll();
    return allAssetTypes.map((assetType) => {
      return {
        id: assetType.id,
      };
    });
  }
  //------------------------------
  async processGroupedAssetType(
    assetType: Partial<AssetTypeInterface>,
    assetCategory: Partial<AssetCategoryInterface>,
  ): Promise<AssetType> {
    return await this.assetTypeRepository.assetTypeRetrievalTransactional(
      assetType,
      assetCategory,
    );
  }
}
