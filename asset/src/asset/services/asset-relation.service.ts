import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AssetRelationTypeRepository } from 'src/asset-relation-type/repositories/asset-relation-type.repository';
import { AssetTypeRelation } from 'src/asset-type/entities/asset-type-relation.entity';
import { AssetTypeRelationRepository } from 'src/asset-type/repositories/asset-type-relation.repository';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';
import { CreateAssetRelationDto } from '../dto/input/create-asset-relation.dto';
import { UpdateAssetRelationDto } from '../dto/input/update-asset-relation.dto';
import { AssetRelation } from '../entities/asset-relation.entity';
import { AssetRelationRepository } from '../repositories/asset-relation.repository';
import { AssetVersionRepository } from '../repositories/asset-version.repository';

@Injectable()
export class AssetRelationService {
  constructor(
    private readonly assetRelationRepository: AssetRelationRepository,
    private readonly assetRelationTypeRepository: AssetRelationTypeRepository,
    private readonly assetTypeRelationRepository: AssetTypeRelationRepository,
    private readonly assetVersionRepository: AssetVersionRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(data: CreateAssetRelationDto): Promise<AssetRelation[]> {
    const { assetRelationTypeId, parentId, childIds } = data;
    const assetRelationType = await this.assetRelationTypeRepository.findOne({
      where: { id: assetRelationTypeId },
    });

    if (!assetRelationType) {
      throw new BadRequestException({
        message: this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
          args: { value: assetRelationTypeId, property: 'Asset Relation Type' },
        }),
      });
    }

    if (!childIds?.length) {
      return [];
    }

    const relations: any[] = [];

    if (childIds?.length) {
      for (const childId of childIds) {
        const [parentAssetVersion, childAssetVersion] = await Promise.all([
          this.assetVersionRepository.findOne({
            where: { id: parentId },
            relations: { assetTypeVersion: { assetType: true } },
          }),
          this.assetVersionRepository.findOne({
            where: { id: childId },
            relations: { assetTypeVersion: { assetType: true } },
          }),
        ]);

        if (
          !parentAssetVersion?.assetTypeVersionId ||
          !childAssetVersion?.assetTypeVersionId
        ) {
          throw new BadRequestException({
            message: this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
              args: {
                value: `${parentId} or ${childId}`,
                property: 'Parent or child asset',
              },
            }),
          });
        }

        const existsAssetTypeRelation =
          await this.assetTypeRelationRepository.findOne({
            where: [
              {
                parentId: parentAssetVersion.assetTypeVersionId,
                childId: childAssetVersion.assetTypeVersionId,
              },
              {
                parentId: childAssetVersion.assetTypeVersionId,
                childId: parentAssetVersion.assetTypeVersionId,
              },
            ] as FindOptionsWhere<AssetTypeRelation>[],
          });

        if (!existsAssetTypeRelation) {
          throw new BadRequestException({
            message: this.i18nService.t('messages.ERROR_CAN_NOT_BE_PAIRED'),
          });
        }

        const body = new AssetRelation({
          assetRelationTypeId,
          assetRelationType,
          parent: parentAssetVersion,
          child: childAssetVersion,
        });

        relations.push(body);
      }
    }

    const savedRelations = await Promise.all(
      relations.map(async (relation) => {
        return await this.assetRelationRepository.save(relation);
      }),
    );

    return savedRelations;
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<AssetRelation>,
  ): Promise<AssetRelation | null> {
    return this.assetRelationRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.assetRelationRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<AssetRelation>,
    updateRelation: UpdateAssetRelationDto,
  ) {
    let body = {};

    if (updateRelation.assetRelationTypeId) {
      const assetRelationType = await this.assetRelationTypeRepository.findOne({
        where: { id: data.assetRelationTypeId },
      });
      body = { ...body, assetRelationType };
    }

    if (updateRelation.parentId) {
      const parent = await this.assetVersionRepository.findOne({
        where: { id: updateRelation.parentId },
      });
      body = { ...body, parent: parent ? [parent] : undefined };
    }

    if (updateRelation.childIds) {
      updateRelation.childIds.forEach(async (childId) => {
        const child = await this.assetVersionRepository.findOne({
          where: { id: childId },
        });
        body = { ...body, child: child ? [child] : undefined };
      });
    }

    return this.assetRelationRepository.update(data, body);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<AssetRelation>) {
    return this.assetRelationRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.assetRelationRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }
}
