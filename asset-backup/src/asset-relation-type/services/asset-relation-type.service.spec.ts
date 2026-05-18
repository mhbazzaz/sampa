import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { mockAssetTypeRelationRepository } from 'src/asset-type/__mocks__/asset-type-relation.repository';
import { AssetTypeRelationRepository } from 'src/asset-type/repositories/asset-type-relation.repository';
import { AssetRelationRepository } from 'src/asset/repositories/asset-relation.repository';
import { RelationDirection } from 'src/common/enums/relation-direction.enum';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';
import { CreateAssetRelationTypeDto } from '../dto/input/create-asset-relation-type.dto';
import { AssetRelationType } from '../entities/asset-relation-type.entity';
import { AssetRelationTypeRepository } from '../repositories/asset-relation-type.repository';
import { AssetRelationTypeService } from './asset-relation-type.service';

const mockAssetRelationType = {
  id: '1',
  name: 'Test Relation Type',
  direction: RelationDirection.BIDIRECTIONAL,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: new Date(),
  _v: 1,
};
const mockAssetRelationRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
};

describe('AssetRelationTypeService', () => {
  let service: AssetRelationTypeService;
  let repository: jest.Mocked<AssetRelationTypeRepository>;
  let assetRelationRepository: jest.Mocked<AssetRelationRepository>;
  let assetTypeRelationRepository: jest.Mocked<AssetTypeRelationRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetRelationTypeService,
        {
          provide: AssetRelationTypeRepository,
          useValue: {
            findAll: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            findAndDelete: jest.fn(),
            findAllPagination: jest.fn(),
            findAllFiltered: jest.fn(),
          },
        },
        {
          provide: AssetRelationRepository,
          useValue: {
            findAll: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            findAndDelete: jest.fn(),
            findAllPagination: jest.fn(),
            findAllFiltered: jest.fn(),
          },
        },
        {
          provide: AssetTypeRelationRepository,
          useValue: {
            findAll: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            findAndDelete: jest.fn(),
            findAllPagination: jest.fn(),
            findAllFiltered: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key) => key),
          },
        },
        {
          provide: AssetRelationRepository,
          useValue: mockAssetRelationRepository,
        },
        {
          provide: AssetTypeRelationRepository,
          useValue: mockAssetTypeRelationRepository,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key) => key),
          },
        },
      ],
    }).compile();

    service = module.get<AssetRelationTypeService>(AssetRelationTypeService);
    repository = module.get(AssetRelationTypeRepository);
    assetRelationRepository = module.get(AssetRelationRepository);
    assetTypeRelationRepository = module.get(AssetTypeRelationRepository);
  });

  describe('create', () => {
    it('should save and return a new asset relation type with direction', async () => {
      const dto: CreateAssetRelationTypeDto = {
        name: 'Test Relation Type',
        direction: RelationDirection.BIDIRECTIONAL,
      };
      const expected = { ...mockAssetRelationType, ...dto };
      repository.save.mockResolvedValue(expected);

      const result = await service.create(dto);
      expect(result).toBe(expected);
      expect(repository.save).toHaveBeenCalledWith(dto);
    });
  });

  describe('findOne', () => {
    it('should find and return a single asset relation type', async () => {
      const options: FindOneOptions<AssetRelationType> = { where: { id: '1' } };
      const result: AssetRelationType = mockAssetRelationType;
      repository.findOne.mockResolvedValue(result);

      expect(await service.findOne(options)).toBe(result);
      expect(repository.findOne).toHaveBeenCalledWith(options);
    });
  });

  describe('findAll', () => {
    it('should return all asset relation types', async () => {
      const result: AssetRelationType[] = [
        mockAssetRelationType,
        {
          ...mockAssetRelationType,
          id: '2',
          name: 'Relation Type 2',
          direction: RelationDirection.BIDIRECTIONAL,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      repository.findAll.mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return the updated asset relation type with direction', async () => {
      const where: FindOptionsWhere<AssetRelationType> = { id: '1' };
      const updateData: Partial<AssetRelationType> = {
        name: 'Updated Relation Type',
        direction: RelationDirection.BIDIRECTIONAL,
      };
      const updatedRelationType: AssetRelationType = {
        ...mockAssetRelationType,
        ...updateData,
        updatedAt: new Date(),
      };
      repository.update.mockResolvedValue(updatedRelationType);

      const result = await service.update(where, updateData);
      expect(result).toBe(updatedRelationType);
      expect(repository.update).toHaveBeenCalledWith(where, updateData);
    });
  });

  describe('remove', () => {
    it('should delete the asset relation type and return the result', async () => {
      const where: FindOptionsWhere<AssetRelationType> = { id: '1' };
      const result = { affected: 1, raw: {}, generatedMaps: [] };
      repository.findAndDelete.mockResolvedValue(result);

      expect(await service.remove('1')).toBe(result);
      expect(repository.findAndDelete).toHaveBeenCalledWith(where);
    });
  });

  describe('findAllPagination', () => {
    it('should return paginated asset relation types', async () => {
      const skip = 0;
      const take = 10;
      const result: [AssetRelationType[], number] = [
        [
          mockAssetRelationType,
          {
            ...mockAssetRelationType,
            id: '2',
            name: 'Relation Type 2',
            direction: RelationDirection.BIDIRECTIONAL,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        2,
      ];
      repository.findAllPagination.mockResolvedValue(result);

      expect(await service.findAllPagination(skip, take)).toBe(result);
      expect(repository.findAllPagination).toHaveBeenCalledWith(skip, take, {
        order: { createdAt: 'DESC' },
      });
    });
  });
});
