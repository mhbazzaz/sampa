import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AssetTypeRelationRepository } from 'src/asset-type/repositories/asset-type-relation.repository';
import { AssetRelationRepository } from 'src/asset/repositories/asset-relation.repository';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';
import { CreateAssetRelationTypeDto } from '../dto/input/create-asset-relation-type.dto';
import { AssetRelationType } from '../entities/asset-relation-type.entity';
import { AssetRelationTypeRepository } from '../repositories/asset-relation-type.repository';

@Injectable()
export class AssetRelationTypeService {
  constructor(
    private readonly assetRelationTypeRepository: AssetRelationTypeRepository,
    private readonly assetRelationRepository: AssetRelationRepository,
    private readonly assetTypeRelationRepository: AssetTypeRelationRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(data: CreateAssetRelationTypeDto): Promise<AssetRelationType> {
    return this.assetRelationTypeRepository.save(data);
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<AssetRelationType>,
  ): Promise<AssetRelationType | null> {
    return this.assetRelationTypeRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.assetRelationTypeRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<AssetRelationType>,
    updateRelationType: Partial<AssetRelationType>,
  ) {
    return this.assetRelationTypeRepository.update(data, updateRelationType);
  }

  //------------------------------
  async remove(id: string) {
    const relations = [];
    const assetRelations = await this.assetRelationRepository.findOne({
      where: { assetRelationTypeId: id },
    });
    if (assetRelations) {
      relations.push(this.i18nService.t('objects.asset relation'));
    }
    const assetTypeRelations = await this.assetTypeRelationRepository.findOne({
      where: { assetRelationTypeId: id },
    });
    if (assetTypeRelations) {
      relations.push(this.i18nService.t('objects.asset type relation'));
    }
    if (relations.length > 0) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_HAS_RELATION', {
          args: {
            property: relations.join(` ${this.i18nService.t('objects.and')} `),
          },
        }),
      );
    }
    return this.assetRelationTypeRepository.findAndDelete({ id });
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.assetRelationTypeRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }
}
