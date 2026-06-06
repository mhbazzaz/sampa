import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import { I18nService } from 'nestjs-i18n';
import { extname, join } from 'path';
import { AssetRelationTypeRepository } from 'src/asset-relation-type/repositories/asset-relation-type.repository';
import {
  RelationDirection,
  RelationDirectionType,
} from 'src/common/enums/relation-direction.enum';
import { allowedIconMimeTypes } from 'src/common/multer-configs/allowed-icon';
import { Filter } from 'src/filter/entities/filter.entity';
import { FilterRepository } from 'src/filter/repositories/filter.repository';
import { FilterService } from 'src/filter/services/filter.service';
import { LocationType } from 'src/location-type/entities/location-type.entity';
import { User } from 'src/users/entities/user.entity';
import { Vault } from 'src/vault/vault';
import { FindOneOptions, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateAssetTypeDto } from '../dto/input/create-asset-type.dto';
import { FindAllAssetTypeQueryUserScopeDto } from '../dto/input/find-all-asset-type-query-user-scope.dto';
import { FindAllAssetTypeQueryDto } from '../dto/input/find-all-asset-type-query.dto';
import { GetAssetTypeVersionUserPaginationDto } from '../dto/input/get-asset-type-version-user-pagination.dto';
import { UpdateAssetTypeDto } from '../dto/input/update-asset-type.dto';
import { AssetTypeRelation } from '../entities/asset-type-relation.entity';
import { AssetTypeVersion } from '../entities/asset-type-version.entity';
import { AssetType } from '../entities/asset-type.entity';
import { AssetTypeRelationRepository } from '../repositories/asset-type-relation.repository';
import { AssetTypeVersionRepository } from '../repositories/asset-type-version.repository';
import { AssetTypeRepository } from '../repositories/asset-type.repository';

@Injectable()
export class AssetTypeService {
  constructor(
    private readonly assetTypeRepository: AssetTypeRepository,
    private readonly assetTypeVersionRepository: AssetTypeVersionRepository,
    private readonly filterRepository: FilterRepository,
    private readonly filterService: FilterService,
    private readonly assetTypeRelationRepository: AssetTypeRelationRepository,
    private readonly assetRelationTypeRepository: AssetRelationTypeRepository,
    private readonly i18nService: I18nService,
  ) {}

  private static readonly INVERSE_RELATION_MAP: Record<
    RelationDirectionType,
    RelationDirectionType | null
  > = {
    [RelationDirectionType.HAS]: RelationDirectionType.IS_INSTALLED_ON,
    [RelationDirectionType.IS_INSTALLED_ON]: RelationDirectionType.HAS,
    [RelationDirectionType.CONTAINS]: RelationDirectionType.BELONGS_TO,
    [RelationDirectionType.BELONGS_TO]: RelationDirectionType.CONTAINS,
    [RelationDirectionType.HOSTS]: RelationDirectionType.RUNS,
    [RelationDirectionType.RUNS]: RelationDirectionType.HOSTS,
    [RelationDirectionType.RELATED]: null,
  };

  //------------------------------
  async create(data: CreateAssetTypeDto): Promise<AssetType> {
    const existingAssetType = await this.assetTypeRepository.findAll({
      where: [{ code: data.code }, { name: data.name }],
    });

    if (existingAssetType.length) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_PROPERTY_EXISTS', {
          args: { property: 'Asset type' },
        }),
      );
    }

    // await this.validationService.validateSchema(data.content);
    const assetType = await this.assetTypeRepository.save({
      code: data.code,
      name: data.name,
      assetCategoryId: data.assetCategoryId,
    });

    let existingFilters: Filter[] = [];
    if (data.assetFilterIds) {
      existingFilters = await this.filterService.findAllFiltered({
        where: { id: In(data.assetFilterIds) },
      });
    }

    this.syncEventIdentifiers(data.content);
    const assetTypeVersion = await this.assetTypeVersionRepository.save({
      assetTypeId: assetType.id,
      content: JSON.stringify(data.content),
      filters: existingFilters,
      hasLocation: data.hasLocation,
      classification: data.classification,
      version: 1,
      locationTypes: data.locationTypeIds
        ? data.locationTypeIds.map(
            (locationTypeId) => new LocationType({ id: locationTypeId }),
          )
        : [],
    });

    const relations: AssetTypeRelation[] = [];
    const uniqueRelations: AssetTypeRelation[] = [];

    if (data.assetRelationIds && data.assetRelationIds.length > 0) {
      for (const relationDto of data.assetRelationIds) {
        const version = await this.assetTypeVersionRepository.findOne({
          where: { id: relationDto.assetTypeVersionId },
          order: { createdAt: 'DESC' },
        });

        if (!version) {
          throw new BadRequestException(
            this.i18nService.t('messages.ERROR_NOT_FOUND', {
              args: { property: 'Asset type version' },
            }),
          );
        }

        const relationType = await this.assetRelationTypeRepository.findOne({
          where: { id: relationDto.assetRelationTypeId },
        });

        if (!relationType) {
          throw new BadRequestException(
            this.i18nService.t('messages.ERROR_NOT_FOUND', {
              args: { property: 'Asset relation type' },
            }),
          );
        }

        const createRelation = (
          parentId: string,
          childId: string,
          assetRelationTypeId: string,
        ) => {
          return new AssetTypeRelation({
            parentId,
            childId,
            assetRelationTypeId,
          });
        };

        if (relationType?.direction === RelationDirection.BIDIRECTIONAL) {
          relations.push(
            createRelation(
              version.id,
              assetTypeVersion.id,
              relationDto.assetRelationTypeId,
            ),
            createRelation(
              assetTypeVersion.id,
              version.id,
              relationDto.assetRelationTypeId,
            ),
          );
        } else {
          const currentRelationName =
            relationType.name as RelationDirectionType;
          const inverseRelationName =
            AssetTypeService.INVERSE_RELATION_MAP[currentRelationName];

          if (inverseRelationName) {
            const inverseRelationType =
              await this.assetRelationTypeRepository.findOne({
                where: { name: inverseRelationName },
              });

            if (!inverseRelationType) {
              throw new BadRequestException(
                this.i18nService.t('messages.ERROR_NOT_FOUND', {
                  args: { property: 'Asset relation type' },
                }),
              );
            }

            relations.push(
              createRelation(
                assetTypeVersion.id,
                version.id,
                relationDto.assetRelationTypeId,
              ),
              createRelation(
                version.id,
                assetTypeVersion.id,
                inverseRelationType.id,
              ),
            );
          }
        }
      }

      if (relations.length > 0) {
        for (const relation of relations) {
          const exists = await this.assetTypeRelationRepository.findOne({
            where: {
              parentId: relation.parentId,
              childId: relation.childId,
              assetRelationTypeId: relation.assetRelationTypeId,
            },
          });

          if (!exists) {
            uniqueRelations.push(relation);
          }
        }
      }
    }

    if (uniqueRelations.length > 0) {
      await this.assetTypeRelationRepository.saveMany(uniqueRelations);
    }

    return assetType;
  }

  //------------------------------
  async findOne(data: FindOneOptions<AssetType>): Promise<AssetType | null> {
    return await this.assetTypeRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return await this.assetTypeRepository.findAll();
  }

  //------------------------------
  async update(assetTypeId: string, updateAssetType: UpdateAssetTypeDto) {
    const {
      code,
      name,
      content,
      hasLocation,
      assetCategoryId,
      assetFilterIds,
      assetRelationIds,
      locationTypeIds,
      classification,
    } = updateAssetType;

    const existingAssetType = await this.assetTypeRepository.findOne({
      where: { id: assetTypeId },
      relations: { assetTypeVersions: true, assetCategory: true },
    });

    if (!existingAssetType) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_RECORD', {
          args: { property: 'Asset type', value: assetTypeId },
        }),
      );
    }

    const latestVersion = existingAssetType.assetTypeVersions?.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];
    if (!latestVersion) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_RECORD'),
      );
    }

    const normalizeArray = (arr?: any[]) => (arr ?? []).map(String).sort();

    const filterChanged =
      assetFilterIds !== undefined &&
      !this.isEqualArray(
        normalizeArray(assetFilterIds),
        normalizeArray(latestVersion.filters?.map((f) => f.id)),
      );

    const relationChanged = assetRelationIds !== undefined;

    const locationChanged =
      hasLocation !== undefined && hasLocation !== latestVersion.hasLocation;

    const locationTypeChanged =
      locationTypeIds !== undefined &&
      !this.isEqualArray(
        normalizeArray(locationTypeIds),
        normalizeArray(latestVersion.locationTypes?.map((lt) => lt.id)),
      );

    let isSameContent = true;
    if (content !== undefined) {
      this.syncEventIdentifiers(content);

      const oldContentObj = latestVersion.content
        ? JSON.parse(latestVersion.content)
        : {};
      isSameContent = this.deepCompareObjects(content, oldContentObj);
    }

    const hasNonContentUpdates =
      locationChanged ||
      filterChanged ||
      locationTypeChanged ||
      relationChanged;

    if (hasNonContentUpdates && (content === undefined || isSameContent)) {
      await this.assetTypeRepository.update(
        { id: assetTypeId },
        {
          code: code ?? existingAssetType.code,
          name: name ?? existingAssetType.name,
          iconPath: existingAssetType.iconPath ?? null,
          assetCategoryId: assetCategoryId ?? existingAssetType.assetCategoryId,
        },
      );

      const versionUpdateData: Partial<AssetTypeVersion> = { classification };

      if (locationChanged) versionUpdateData.hasLocation = hasLocation!;
      if (filterChanged && assetFilterIds) {
        const filters = await this.filterService.findAllFiltered({
          where: { id: In(assetFilterIds) },
        });
        versionUpdateData.filters = filters;
      }

      if (locationTypeChanged && locationTypeIds !== undefined) {
        versionUpdateData.locationTypes = locationTypeIds.length
          ? locationTypeIds.map((id) => new LocationType({ id }))
          : [];
      }

      if (Object.keys(versionUpdateData).length > 0) {
        await this.assetTypeVersionRepository.update(
          { id: latestVersion.id },
          versionUpdateData,
        );
      }

      if (assetRelationIds !== undefined) {
        await this.replaceRelations(latestVersion.id, assetRelationIds);
      }

      const updatedVersion = await this.assetTypeVersionRepository.findOne({
        where: { id: latestVersion.id },
        relations: { filters: true, locationTypes: true, children: true },
      });

      return {
        assetType: existingAssetType,
        assetTypeVersion: updatedVersion ?? latestVersion,
      };
    }

    const savedAssetType = await this.assetTypeRepository.update(
      { id: assetTypeId },
      {
        code: code ?? existingAssetType.code,
        name: name ?? existingAssetType.name,
        iconPath: existingAssetType.iconPath ?? null,
        assetCategoryId: assetCategoryId ?? existingAssetType.assetCategoryId,
      },
    );

    await this.assetTypeVersionRepository.update(
      { id: latestVersion.id },
      { archived: true },
    );

    const newAssetTypeVersion = new AssetTypeVersion({
      assetTypeId: savedAssetType.id,
      content:
        content !== undefined ? JSON.stringify(content) : latestVersion.content,
      hasLocation: hasLocation ?? latestVersion.hasLocation,
      version: latestVersion.version + 1,
      archived: false,
      classification,
    });

    if (assetFilterIds) {
      const filters = await this.filterService.findAllFiltered({
        where: { id: In(assetFilterIds) },
      });
      newAssetTypeVersion.filters = filters;
    } else {
      newAssetTypeVersion.filters = latestVersion.filters;
    }

    if (locationTypeIds !== undefined) {
      newAssetTypeVersion.locationTypes = locationTypeIds
        ? locationTypeIds.map(
            (locationTypeId) => new LocationType({ id: locationTypeId }),
          )
        : [];
    }

    const savedAssetTypeVersion =
      await this.assetTypeVersionRepository.save(newAssetTypeVersion);

    if (assetRelationIds !== undefined) {
      await this.replaceRelations(savedAssetTypeVersion.id, assetRelationIds);
    } else {
      const relationsToCopy =
        latestVersion.children?.map((rel) => ({
          parentId: rel.parentId,
          childId: savedAssetTypeVersion.id,
          assetRelationTypeId: rel.assetRelationTypeId,
        })) || [];

      if (relationsToCopy.length > 0) {
        await this.assetTypeRelationRepository.saveMany(relationsToCopy);
      }
    }

    return {
      assetType: savedAssetType,
      assetTypeVersion: savedAssetTypeVersion,
    };
  }

  //------------------------------
  private searchIdentifierInSchema(schema: any, identifier: string): boolean {
    if (!schema || typeof schema !== 'object') {
      return false;
    }

    if (schema.metadata?.identifier === identifier) {
      return true;
    }

    if (schema.properties?.[identifier]) {
      return true;
    }

    for (const key of Object.keys(schema)) {
      const value = schema[key];

      if (Array.isArray(value)) {
        if (
          value.some((item) => this.searchIdentifierInSchema(item, identifier))
        ) {
          return true;
        }
      } else if (typeof value === 'object' && value !== null) {
        if (this.searchIdentifierInSchema(value, identifier)) {
          return true;
        }
      }
    }

    return false;
  }

  //------------------------------
  async findByIdentifier(identifier: string): Promise<AssetType[]> {
    const versions = await this.assetTypeVersionRepository.findAllFiltered({
      where: {
        archived: false,
      },
      relations: {
        assetType: {
          assetCategory: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const matchedAssetTypes: AssetType[] = [];

    for (const version of versions) {
      try {
        const schema = JSON.parse(version.content);
        const found = this.searchIdentifierInSchema(schema, identifier);

        if (found && version.assetType) {
          const cleanVersion = {
            ...version,
            assetType: undefined,
          };

          const cleanAssetType = {
            ...version.assetType,
            assetTypeVersions: [cleanVersion],
          } as AssetType;

          matchedAssetTypes.push(cleanAssetType);
        }
      } catch (error) {
        console.error(`Failed parsing schema for version ${version.id}`, error);
      }
    }

    return matchedAssetTypes;
  }

  //------------------------------
  async replaceRelations(
    assetTypeVersionId: string,
    assetRelationDtos: Array<{
      assetTypeVersionId: string;
      assetRelationTypeId: string;
    }>,
  ) {
    const assetTypeVersion = await this.assetTypeVersionRepository.findOne({
      where: { id: assetTypeVersionId },
    });

    if (!assetTypeVersion) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_RECORD', {
          args: { property: 'Asset Type Version', value: assetTypeVersionId },
        }),
      );
    }

    const uniqueRelationDtos = Array.from(
      new Map(
        assetRelationDtos.map((dto) => [
          `${dto.assetTypeVersionId}_${dto.assetRelationTypeId}`,
          dto,
        ]),
      ).values(),
    );

    await this.validateRelationsExist(uniqueRelationDtos);

    const existingRelations = await this.assetTypeRelationRepository.findAll({
      where: [
        { parentId: assetTypeVersionId },
        { childId: assetTypeVersionId },
      ],
    });

    if (uniqueRelationDtos.length === 0) {
      if (existingRelations.length > 0) {
        const existingRelationIds = existingRelations.map((e) => e.id);
        await this.assetTypeRelationRepository.deleteMany(existingRelationIds);
      }
      return;
    }

    const desiredRelations: AssetTypeRelation[] = [];
    for (const dto of uniqueRelationDtos) {
      const otherVersionId = dto.assetTypeVersionId;
      const relationType = await this.assetRelationTypeRepository.findOne({
        where: { id: dto.assetRelationTypeId },
      });

      if (!relationType) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND', {
            args: { property: 'Asset relation type' },
          }),
        );
      }

      if (relationType.direction === RelationDirection.BIDIRECTIONAL) {
        desiredRelations.push(
          new AssetTypeRelation({
            parentId: assetTypeVersionId,
            childId: otherVersionId,
            assetRelationTypeId: dto.assetRelationTypeId,
          }),
          new AssetTypeRelation({
            parentId: otherVersionId,
            childId: assetTypeVersionId,
            assetRelationTypeId: dto.assetRelationTypeId,
          }),
        );
      } else {
        desiredRelations.push(
          new AssetTypeRelation({
            parentId: assetTypeVersionId,
            childId: otherVersionId,
            assetRelationTypeId: dto.assetRelationTypeId,
          }),
        );

        const currentName = relationType.name as RelationDirectionType;
        const inverseName = AssetTypeService.INVERSE_RELATION_MAP[currentName];

        if (inverseName) {
          const inverseType = await this.assetRelationTypeRepository.findOneBy({
            name: inverseName,
          });

          if (!inverseType) {
            throw new BadRequestException(
              this.i18nService.t('messages.ERROR_NOT_FOUND', {
                args: { property: 'Inverse asset relation type' },
              }),
            );
          }

          desiredRelations.push(
            new AssetTypeRelation({
              parentId: otherVersionId,
              childId: assetTypeVersionId,
              assetRelationTypeId: inverseType.id,
            }),
          );
        }
      }
    }

    const relationToKey = (rel: AssetTypeRelation) =>
      `${rel.parentId}|${rel.childId}|${rel.assetRelationTypeId}`;

    const existingRelationMap = new Map(
      existingRelations.map((rel) => [relationToKey(rel), rel]),
    );

    const desiredRelationMap = new Map(
      desiredRelations.map((rel) => [relationToKey(rel), rel]),
    );

    const relationsToDelete: AssetTypeRelation[] = [];
    const relationsToCreate: AssetTypeRelation[] = [];

    for (const [key, rel] of existingRelationMap) {
      if (!desiredRelationMap.has(key)) {
        relationsToDelete.push(rel);
      }
    }

    for (const [key, rel] of desiredRelationMap) {
      if (!existingRelationMap.has(key)) {
        relationsToCreate.push(rel);
      }
    }

    const relationToDeleteIds = relationsToDelete.map((r) => r.id);
    if (relationsToDelete.length > 0) {
      await this.assetTypeRelationRepository.deleteMany(relationToDeleteIds);
    }

    if (relationsToCreate.length > 0) {
      await this.assetTypeRelationRepository.saveMany(relationsToCreate);
    }
  }

  //------------------------------
  private async validateRelationsExist(
    dtos: Array<{ assetTypeVersionId: string; assetRelationTypeId: string }>,
  ) {
    const assetTypeVersionIds = [
      ...new Set(dtos.map((dto) => dto.assetTypeVersionId)),
    ];

    if (assetTypeVersionIds.length > 0) {
      const existingVersions = await this.assetTypeVersionRepository.findAll({
        where: { id: In(assetTypeVersionIds) },
      });

      if (existingVersions.length !== assetTypeVersionIds.length) {
        throw new BadRequestException({
          message: this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
            args: {
              value: assetTypeVersionIds.join(', '),
              property: 'Asset Type Version',
            },
          }),
        });
      }
    }

    const assetRelationTypeIds = [
      ...new Set(dtos.map((dto) => dto.assetRelationTypeId)),
    ];

    if (assetRelationTypeIds.length > 0) {
      const existingTypes = await this.assetRelationTypeRepository.findAll({
        where: { id: In(assetRelationTypeIds) },
      });

      if (existingTypes.length !== assetRelationTypeIds.length) {
        throw new BadRequestException({
          message: this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
            args: {
              value: assetRelationTypeIds.join(', '),
              property: 'Asset Relation Type',
            },
          }),
        });
      }
    }
  }

  //------------------------------
  async updateAssetTypeIcon(id: string, icon: Express.Multer.File) {
    let iconPath: string | undefined = undefined;
    if (icon) iconPath = await this.handleIconUpload(icon);

    return this.assetTypeRepository.update(
      { id },
      {
        iconPath,
      },
    );
  }

  //------------------------------
  async remove(id: string) {
    const relations = [];

    const assetTypeVersions = await this.assetTypeVersionRepository.findAll({
      where: { assetTypeId: id },
      select: { id: true },
    });

    if (assetTypeVersions.length > 0) {
      const versionIds = assetTypeVersions.map((v) => v.id);

      const assetTypeRelations = await this.assetTypeRelationRepository.findOne(
        {
          where: [{ parentId: In(versionIds) }, { childId: In(versionIds) }],
        },
      );

      if (assetTypeRelations) {
        relations.push(this.i18nService.t('objects.asset type relation'));
      }

      if (relations.length > 0) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_HAS_RELATION', {
            args: {
              property: relations.join(
                ` ${this.i18nService.t('objects.and')} `,
              ),
            },
          }),
        );
      }

      if (versionIds.length > 0) {
        await this.assetTypeVersionRepository.findAndDelete({
          assetTypeId: id,
        });
      }
    }

    return await this.assetTypeRepository.findAndDelete({ id });
  }

  //------------------------------
  async findAllPaginationAdminScope(query: FindAllAssetTypeQueryDto) {
    const [items, total] =
      await this.assetTypeRepository.findAllPaginationAdminScope(query);

    const itemsWithLatestVersion = await Promise.all(
      items.map(async (item) => {
        const versions = await this.assetTypeVersionRepository.findAll({
          where: { assetTypeId: item.id },
          relations: {
            assetType: true,
            locationTypes: true,
            parents: {
              assetRelationType: true,
              parent: true,
              child: true,
            },
            children: {
              assetRelationType: true,
              parent: true,
              child: true,
            },
          },
          order: { createdAt: 'DESC' },
        });

        return {
          ...item,
          latestVersion: versions[0] || null,
        };
      }),
    );

    return { items: itemsWithLatestVersion, total };
  }

  //------------------------------
  async findOneByIdAdminScope(id: string) {
    const [versions, assetType] = await Promise.all([
      this.assetTypeVersionRepository.findAll({
        where: { assetTypeId: id },
        relations: {
          assetType: true,
          locationTypes: true,
          parents: {
            assetRelationType: true,
            parent: { assetType: true },
          },
          children: {
            assetRelationType: true,
            child: { assetType: true },
          },
        },
        order: { createdAt: 'DESC' },
      }),
      this.assetTypeRepository.findOne({
        where: { id },
        relations: {
          assetCategory: true,
          assetTypeVersions: { locationTypes: true },
        },
      }),
    ]);

    return {
      ...assetType,
      latestVersion: {
        ...versions[0],
      },
    };
  }

  //------------------------------
  async findOneVersionById(id: string) {
    const version = await this.assetTypeVersionRepository.findOne({
      where: { id },
      relations: {
        assetType: true,
        locationTypes: true,
        parents: {
          assetRelationType: true,
          parent: { assetType: true },
        },
        children: {
          assetRelationType: true,
          child: { assetType: true },
        },
      },
    });

    return version;
  }

  //------------------------------
  async findOneByName(name: string) {
    const assetType = await this.assetTypeRepository.findOne({
      where: { name },
    });

    if (!assetType) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: {
            property: `Asset Type`,
            name,
          },
        }),
      );
    }

    const versions = await this.assetTypeVersionRepository.findAll({
      where: { assetTypeId: assetType.id },
      relations: {
        assetType: true,
        locationTypes: true,
        parents: {
          assetRelationType: true,
          parent: { assetType: true },
          child: { assetType: true },
        },
        children: {
          assetRelationType: true,
          parent: { assetType: true },
          child: { assetType: true },
        },
      },
      order: { createdAt: 'DESC' },
    });

    return {
      ...assetType,
      latestVersion: {
        ...versions[0],
      },
    };
  }

  //------------------------------
  async findAllForAssetType(id: string): Promise<Filter[] | null> {
    return await this.filterRepository.findAll({
      where: { assetTypeVersions: { assetTypeId: id } },
      relations: { assetTypeVersions: { assetType: true }, filterValues: true },
    });
  }

  //------------------------------
  async findOneByIdUserScope(id: string) {
    const [versions, assetType] = await Promise.all([
      this.assetTypeVersionRepository.findAll({
        where: { assetTypeId: id },
        relations: {
          assetType: true,
          locationTypes: true,
          parents: {
            assetRelationType: true,
            parent: true,
            child: true,
          },
          children: {
            assetRelationType: true,
            parent: true,
            child: true,
          },
        },
        order: { createdAt: 'DESC' },
      }),
      this.assetTypeRepository.findOne({
        where: { id },
        relations: {
          assetCategory: true,
        },
      }),
    ]);

    return {
      ...assetType,
      latestVersion: versions[0],
    };
  }

  //------------------------------
  async findOneAssetTypeVersionByIdUserScope(
    query: GetAssetTypeVersionUserPaginationDto,
    assetTypeId: string,
  ) {
    return this.assetTypeVersionRepository.findOneAssetTypeVersionByIdUserScope(
      {
        skip: query.skip,
        take: query.take,
        assetTypeId,
        version: query.version ? +query.version : undefined,
        shouldBeRelatedToAssetTypeVersionId:
          query.shouldBeRelatedToAssetTypeVersionId,
      },
    );
  }

  //------------------------------
  async findOneByIdIncludeFiltersUserScope(
    id: string,
  ): Promise<AssetType | null> {
    return await this.assetTypeRepository.findOne({
      where: { id },
      relations: {
        assetTypeVersions: {
          filters: {
            assetTypeVersions: true,
            filterValues: true,
          },
        },
      },
    });
  }

  //------------------------------
  async findAllPaginationUserScope(query: FindAllAssetTypeQueryUserScopeDto) {
    const [items, total] =
      await this.assetTypeRepository.findAllPaginationUserScope(query);

    const itemsWithLatestVersion = await Promise.all(
      items.map(async (item) => {
        const versions = await this.assetTypeVersionRepository.findAll({
          where: { assetTypeId: item.id },
          relations: {
            assetType: true,
            locationTypes: true,
            parents: {
              assetRelationType: true,
              parent: true,
              child: true,
            },
            children: {
              assetRelationType: true,
              parent: true,
              child: true,
            },
          },
          order: { createdAt: 'DESC' },
        });

        return {
          ...item,
          latestVersion: versions[0] || null,
        };
      }),
    );

    return { items: itemsWithLatestVersion, total };
  }

  //------------------------------
  async getAssetTypeArchives(id: string) {
    return await this.assetTypeRepository.findAll({
      where: { id },
      order: { createdAt: 'DESC' },
      select: { id: true, code: true, name: true },
      relations: { assetTypeVersions: true },
    });
  }

  //------------------------------
  async findTypeForSampaUser(
    skip: number,
    take: number,
    name: string,
    categoryId: string,
    user: User,
  ) {
    const SAMPA_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'SAMPA_SERVICE_INTERNAL_TOKEN',
      'share',
    );

    const SAMPA_SERVICE_URL = await Vault.instance.get('SAMPA_SERVICE_URL');

    const { data } = await axios.get<{ data: { id: string }[] }>(
      `${SAMPA_SERVICE_URL}/sampa/api/v1/asset-type/internal`,
      {
        headers: {
          'x-internal-communication-token': SAMPA_SERVICE_INTERNAL_TOKEN,
        },
      },
    );

    const assetTypeIds = data.data.map((assetType) => {
      return assetType.id;
    });

    return await this.assetTypeRepository.findTypeForSampaUser(
      skip,
      take,
      name,
      categoryId,
      user,
      assetTypeIds,
    );
  }

  //------------------------------
  async findRelatedAssetTypes(assetTypeVersionId: string) {
    return await this.assetTypeRepository.findRelatedAssetTypes(
      assetTypeVersionId,
    );
  }

  //------------------------------
  private async handleIconUpload(icon: Express.Multer.File): Promise<string> {
    if (!icon || !icon.buffer) {
      throw new BadRequestException('No file provided.');
    }

    const fileExtension = extname(icon.originalname).toLowerCase();
    const expectedMimeType = allowedIconMimeTypes[fileExtension];

    if (!expectedMimeType || icon.mimetype !== expectedMimeType) {
      throw new BadRequestException('Invalid file type or MIME type');
    }

    const p = 'files/assetType/icons';
    const uploadPath = join(process.cwd(), p);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filename = `${Date.now()}-${icon.originalname}`;
    const filePath = join(uploadPath, filename);

    fs.writeFileSync(filePath, icon.buffer);
    return p + '/' + filename;
  }

  //------------------------------
  private isEqualArray(arr1: string[], arr2?: string[]): boolean {
    if (!arr2 || arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  }

  //------------------------------
  private deepCompareObjects(objOne: any, objTwo: any): boolean {
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
  private syncEventIdentifiers(schema: any): void {
    if (!schema || typeof schema !== 'object') {
      return;
    }

    if (schema.metadata && typeof schema.metadata === 'object') {
      const hasEventType = !!schema.metadata.eventType;

      if (hasEventType) {
        if (!schema.metadata.identifier) {
          schema.metadata.identifier = uuidv4();
        }
      } else {
        if (schema.metadata.identifier) {
          delete schema.metadata.identifier;
        }
      }
    }

    if (schema.type === 'object' && schema.properties) {
      Object.values(schema.properties).forEach((property: any) => {
        this.syncEventIdentifiers(property);
      });
    }

    if (schema.type === 'array' && schema.items) {
      this.syncEventIdentifiers(schema.items);
    }

    ['allOf', 'oneOf', 'anyOf'].forEach((key) => {
      if (Array.isArray(schema[key])) {
        schema[key].forEach((item: any) => {
          this.syncEventIdentifiers(item);
        });
      }
    });
  }
}
