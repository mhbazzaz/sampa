import { Injectable } from '@nestjs/common';
import { GroupMembershipRepository } from 'src/group-membership/repositories/group-membership.repository';
import { Member } from 'src/member/entities/member.entity';
import { DeepPartial, FindOneOptions, FindOptionsWhere, In } from 'typeorm';
import { AssetCategory } from '../entities/asset-category.entity';
import { AssetCategoryRepository } from '../repositories/asset-category.repository';
import { AssetTypeRepository } from '../repositories/asset-type.repository';

@Injectable()
export class AssetCategoryService {
  constructor(
    private readonly assetCategoryRepository: AssetCategoryRepository,
    private readonly assetTypeRepository: AssetTypeRepository,
    private readonly groupMembershipRepository: GroupMembershipRepository,
  ) {}

  //------------------------------
  async create(data: DeepPartial<AssetCategory>): Promise<AssetCategory> {
    return this.assetCategoryRepository.save(data);
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<AssetCategory>,
  ): Promise<AssetCategory | null> {
    return this.assetCategoryRepository.findOne(data);
  }

  //------------------------------
  async findOneMyAssetTypes(assetCategoryId: string, member: Member) {
    const groups = await this.groupMembershipRepository.findAll({
      where: { userId: member.id },
      select: { groupId: true },
    });

    return this.assetTypeRepository.findAll({
      where: {
        assetCategoryId: assetCategoryId,
        assetToAudit: {
          group: { id: In(groups.map((group) => group.groupId)) },
        },
      },
    });
  }

  //------------------------------
  async findAll() {
    return this.assetCategoryRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<AssetCategory>,
    updateAsset: Partial<AssetCategory>,
  ) {
    return this.assetCategoryRepository.update(data, updateAsset);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<AssetCategory>) {
    return this.assetCategoryRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.assetCategoryRepository.findAllPagination(skip, take, {
      relations: { assetTypes: true },
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async findAllScopeInternal() {
    return this.assetCategoryRepository.findAllScopeInternal();
  }

  //------------------------------
  async findAllMyCategories(skip: number, take: number, member: Member) {
    const groups = await this.groupMembershipRepository.findAll({
      where: { userId: member.id },
      select: { groupId: true },
    });

    return this.assetCategoryRepository.findAllPagination(skip, take, {
      relations: { assetTypes: true },
      order: { createdAt: 'DESC' },
      where: {
        assetTypes: {
          assetToAudit: {
            group: { id: In(groups.map((group) => group.groupId)) },
          },
        },
      },
    });
  }

  //------------------------------
  async findAllFiltered({
    where,
  }: {
    where: FindOptionsWhere<AssetCategory>;
  }): Promise<AssetCategory[]> {
    return this.assetCategoryRepository.findAllFiltered({
      where,
      order: { createdAt: 'DESC' },
    });
  }
}
