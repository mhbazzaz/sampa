import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { mockAssetTypeRepository } from 'src/asset-type/__mocks__/asset-type.repository';
import { AssetTypeRepository } from 'src/asset-type/repositories/asset-type.repository';
import { CheckAssetCategoryExistValidator } from 'src/common/validations/check-asset-category-exists.validator';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { FindOneOptions, FindOptionsWhere, ILike, UpdateResult } from 'typeorm';
import { mockAssetCategoryRepository } from '../__mocks__/asset-category.repository';
import { CreateAssetCategoryDto } from '../dto/input/create-asset-category.dto';
import { FindAllAdminScopeDto } from '../dto/input/find-all-admin-scope-quey.dto';
import { AssetCategory } from '../entities/asset-category.entity';
import { AssetCategoryRepository } from '../repositories/asset-category.repository';
import { AssetCategoryService } from './asset-category.service';

const mockAssetCategory: AssetCategory = {
  id: '1',
  name: 'Test Category',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: new Date(),
  _v: 1,
};

describe('AssetCategoryService', () => {
  let service: AssetCategoryService;
  let repository: jest.Mocked<AssetCategoryRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetCategoryService,
        {
          provide: AssetCategoryRepository,
          useValue: mockAssetCategoryRepository,
        },
        {
          provide: AssetTypeRepository,
          useValue: mockAssetTypeRepository,
        },
        {
          provide: ValidationService,
          useValue: {
            isUUID: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: CheckAssetCategoryExistValidator,
          useValue: {
            validate: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest
              .fn()
              .mockImplementation((key, opts) =>
                opts?.args?.property ? `${key} ${opts.args.property}` : key,
              ),
          },
        },
      ],
    }).compile();

    service = module.get<AssetCategoryService>(AssetCategoryService);
    repository = module.get(AssetCategoryRepository);
  });

  describe('create', () => {
    it('should save and return a new asset category', async () => {
      const dto: CreateAssetCategoryDto = { name: 'Test Category' };
      const result: AssetCategory = mockAssetCategory;
      repository.save.mockResolvedValue(result);

      expect(await service.create(dto)).toBe(result);
      expect(repository.save).toHaveBeenCalledWith(dto);
    });
  });

  describe('findOne', () => {
    it('should find and return a single asset category', async () => {
      const options: FindOneOptions<AssetCategory> = { where: { id: '1' } };
      const result: AssetCategory = mockAssetCategory;
      repository.findOne.mockResolvedValue(result);

      expect(await service.findOne(options)).toBe(result);
      expect(repository.findOne).toHaveBeenCalledWith(options);
    });
  });

  describe('findAll', () => {
    it('should return all asset categories', async () => {
      const result: AssetCategory[] = [
        mockAssetCategory,
        {
          ...mockAssetCategory,
          id: '2',
          name: 'Category 2',
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
    it('should update and return the updated asset category', async () => {
      const where: FindOptionsWhere<AssetCategory> = { id: '1' };
      const updateData: Partial<AssetCategory> = { name: 'Updated Category' };
      const updatedCategory: AssetCategory = mockAssetCategory;

      repository.update.mockResolvedValue(updatedCategory);

      expect(await service.update(where, updateData)).toBe(updatedCategory);
      expect(repository.update).toHaveBeenCalledWith(where, updateData);
    });
  });

  describe('remove', () => {
    it('should delete the asset category and return the result', async () => {
      const where: FindOptionsWhere<AssetCategory> = { id: '1' };
      const result: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      repository.findAndDelete.mockResolvedValue(result);

      expect(await service.remove('1')).toBe(result);
      expect(repository.findAndDelete).toHaveBeenCalledWith(where);
    });
  });

  describe('findAllPagination', () => {
    it('should return paginated asset categories', async () => {
      const query: FindAllAdminScopeDto = { skip: 0, take: 10, name: 'Test' };
      const result: [AssetCategory[], number] = [
        [
          {
            id: '1',
            name: 'Test',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: new Date(),
            _v: 1,
          },
        ],
        1,
      ];

      repository.findAllPagination.mockResolvedValue(result);

      expect(await service.findAllPagination(query)).toBe(result);
      expect(repository.findAllPagination).toHaveBeenCalledWith(
        query.skip,
        query.take,
        {
          where: { name: ILike('%Test%') },
          order: { createdAt: 'DESC' },
          relations: { assetTypes: true },
        },
      );
    });
  });

  describe('findAllPaginationUserScope', () => {
    it('should return paginated asset categories for users', async () => {
      const skip = 0;
      const take = 10;
      const name = 'Test';
      const result: [AssetCategory[], number] = [
        [
          {
            id: '1',
            name: 'Test',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: new Date(),
            _v: 1,
          },
        ],
        1,
      ];

      repository.findAllPagination.mockResolvedValue(result);

      expect(await service.findAllPaginationUserScope(skip, take, name)).toBe(
        result,
      );
      expect(repository.findAllPagination).toHaveBeenCalledWith(skip, take, {
        where: { name: ILike('%Test%') },
        order: { createdAt: 'DESC' },
        relations: { assetTypes: true },
      });
    });
  });
});
