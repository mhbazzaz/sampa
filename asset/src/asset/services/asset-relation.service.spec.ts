import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { AssetRelationType } from 'src/asset-relation-type/entities/asset-relation-type.entity';
import { AssetRelationTypeRepository } from 'src/asset-relation-type/repositories/asset-relation-type.repository';
import { AssetTypeRelationRepository } from 'src/asset-type/repositories/asset-type-relation.repository';
import { AssetStatusEnum } from 'src/common/enums/asset-status.enum';
import { RelationDirection } from 'src/common/enums/relation-direction.enum';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { FindOneOptions } from 'typeorm';
import { CreateAssetRelationDto } from '../dto/input/create-asset-relation.dto';
import { AssetRelation } from '../entities/asset-relation.entity';
import { AssetVersion } from '../entities/asset-version.entity';
import { Asset } from '../entities/asset.entity';
import { AssetRelationRepository } from '../repositories/asset-relation.repository';
import { AssetVersionRepository } from '../repositories/asset-version.repository';
import { AssetRepository } from '../repositories/asset.repository';
import { AssetRelationService } from './asset-relation.service';

describe('AssetRelationService', () => {
  let service: AssetRelationService;
  let assetRelationRepository: jest.Mocked<AssetRelationRepository>;
  let assetRelationTypeRepository: jest.Mocked<AssetRelationTypeRepository>;
  let assetVersionRepository: jest.Mocked<AssetVersionRepository>;
  let assetTypeRelationRepository: jest.Mocked<AssetTypeRelationRepository>;
  let i18nService: jest.Mocked<I18nService>;

  const mockAsset: Asset = {
    id: 'asset-1',
    referenceId: 'ASSET-001',
    name: 'Main Asset',
    description: 'Primary asset description',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    _v: 1,
    externalRefId: 'EXT-001',
    assetTypeId: 'type-1',
    assetVersions: [],
    tags: [],
  };

  const mockAssetVersion: AssetVersion = {
    id: 'version-1',
    version: 1,
    baseline: 'baseline-1',
    content: 'Asset content',
    status: AssetStatusEnum.InService,
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    _v: 1,
    accountableUnitId: 'unit-1',
    accountableId: 'user-1',
    editorId: 'editor-1',
    editorUnitId: 'editor-unit-1',
    assetTypeVersionId: 'type-version-1',
    assetId: 'asset-1',
    asset: mockAsset,
    parents: [],
    children: [],
    filterValues: [],
    locationId: 'loc-1',
    reputationScore: 0,
    integrityScore: 0,
    financialScore: 0,
    confidentialityScore: 0,
    availabilityScore: 0,
    evaluationScore: 0,
    updateUserId: null,
  };

  const mockChildAssetVersion: AssetVersion = {
    id: 'version-2',
    version: 1,
    baseline: 'baseline-1',
    content: 'Child asset content',
    status: AssetStatusEnum.InService,
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    _v: 1,
    accountableUnitId: 'unit-2',
    accountableId: 'user-2',
    editorId: 'editor-2',
    editorUnitId: 'editor-unit-2',
    assetTypeVersionId: 'type-version-2',
    assetId: 'asset-2',
    asset: {
      ...mockAsset,
      id: 'asset-2',
      referenceId: 'ASSET-002',
      name: 'Child Asset',
    },
    parents: [],
    children: [],
    filterValues: [],
    locationId: 'loc-2',
    reputationScore: 0,
    integrityScore: 0,
    financialScore: 0,
    confidentialityScore: 0,
    availabilityScore: 0,
    evaluationScore: 0,
    updateUserId: null,
  };

  const mockAssetRelationType: AssetRelationType = {
    id: 'relation-type-1',
    name: 'Dependency',
    direction: RelationDirection.BIDIRECTIONAL,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    _v: 1,
    assetRelations: [],
    assetTypeRelations: [],
  };

  const mockAssetRelation: AssetRelation = {
    id: 'relation-1',
    assetRelationTypeId: 'relation-type-1',
    parentId: 'version-1',
    childId: 'version-2',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    _v: 1,
    assetRelationType: mockAssetRelationType,
    parent: mockAssetVersion,
    child: mockChildAssetVersion,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetRelationService,
        {
          provide: AssetRelationRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
        {
          provide: AssetRelationTypeRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AssetVersionRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AssetTypeRelationRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AssetRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ValidationService,
          useValue: {
            validate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key) => key),
          },
        },
      ],
    }).compile();

    service = module.get<AssetRelationService>(AssetRelationService);
    assetRelationRepository = module.get(AssetRelationRepository);
    assetRelationTypeRepository = module.get(AssetRelationTypeRepository);
    assetVersionRepository = module.get(AssetVersionRepository);
    assetTypeRelationRepository = module.get(AssetTypeRelationRepository);
    i18nService = module.get(I18nService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw if asset relation type not found', async () => {
      const dto: CreateAssetRelationDto = {
        assetRelationTypeId: '1',
        parentId: '1',
        childIds: ['2'],
      };

      assetRelationTypeRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw if parent or child asset not found', async () => {
      const dto: CreateAssetRelationDto = {
        assetRelationTypeId: '1',
        parentId: '1',
        childIds: ['2'],
      };

      assetRelationTypeRepository.findOne.mockResolvedValue(
        mockAssetRelationType,
      );
      assetVersionRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw if asset type relation not found', async () => {
      const dto: CreateAssetRelationDto = {
        assetRelationTypeId: '1',
        parentId: '1',
        childIds: ['2'],
      };

      assetRelationTypeRepository.findOne.mockResolvedValue(
        mockAssetRelationType,
      );
      assetVersionRepository.findOne
        .mockResolvedValueOnce(mockAssetVersion)
        .mockResolvedValueOnce(mockChildAssetVersion);
      assetTypeRelationRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return an asset relation', async () => {
      const options: FindOneOptions<AssetRelation> = { where: { id: '1' } };
      assetRelationRepository.findOne.mockResolvedValue(mockAssetRelation);

      const result = await service.findOne(options);

      expect(result).toEqual(mockAssetRelation);
      expect(assetRelationRepository.findOne).toHaveBeenCalledWith(options);
    });

    it('should return null if not found', async () => {
      const options: FindOneOptions<AssetRelation> = { where: { id: '1' } };
      assetRelationRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(options);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all asset relations', async () => {
      assetRelationRepository.findAll.mockResolvedValue([mockAssetRelation]);

      const result = await service.findAll();

      expect(result).toEqual([mockAssetRelation]);
      expect(assetRelationRepository.findAll).toHaveBeenCalled();
    });
  });
});
