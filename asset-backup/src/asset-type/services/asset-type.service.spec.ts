import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { AssetRelationTypeRepository } from 'src/asset-relation-type/repositories/asset-relation-type.repository';
import { AssetTypeRelationRepository } from 'src/asset-type/repositories/asset-type-relation.repository';
import { AssetTypeRepository } from 'src/asset-type/repositories/asset-type.repository';
import { AssetTypeService } from 'src/asset-type/services/asset-type.service';
import { CheckAssetTypeCodeExistValidator } from 'src/common/validations/check-asset-type-code-exists.validator';
import { CheckAssetTypeNameExistValidator } from 'src/common/validations/check-asset-type-name-exists.validator';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { mockFilterRepository } from 'src/filter/__mocks__/filter.repository';
import { FilterRepository } from 'src/filter/repositories/filter.repository';
import { FilterService } from 'src/filter/services/filter.service';
import { LocationTypeRepository } from 'src/location-type/repositories/location-type.repository';
import { AssetTypeVersionRepository } from '../repositories/asset-type-version.repository';
import { AssetTypeVersionService } from './asset-type-version.service';

describe('AssetTypeService', () => {
  let service: AssetTypeService;

  const mockAssetTypeRepository = {
    findAll: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    findAndDelete: jest.fn(),
    findAllPagination: jest.fn(),
    findAllFiltered: jest.fn(),
    find: jest.fn(),
  };

  const mockFilterService = {
    findAllFiltered: jest.fn(),
  };

  const mockAssetTypeRelationRepository = {
    saveMany: jest.fn(),
    find: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    deleteMany: jest.fn(),
    getRelatedAssetType: jest.fn(),
  };

  const mockAssetRelationTypeRepository = {
    findAll: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    findAndDelete: jest.fn(),
    findAllPagination: jest.fn(),
    findAllFiltered: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetTypeService,
        {
          provide: AssetTypeRepository,
          useValue: mockAssetTypeRepository,
        },
        {
          provide: AssetRelationTypeRepository,
          useValue: mockAssetRelationTypeRepository,
        },
        {
          provide: AssetTypeVersionRepository,
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            findAll: jest.fn(),
            deleteMany: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: LocationTypeRepository,
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            findAll: jest.fn(),
            deleteMany: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: AssetTypeVersionService,
          useValue: {
            archiveOldVersions: jest.fn(),
          },
        },
        {
          provide: ValidationService,
          useValue: {
            isUUID: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: CheckAssetTypeCodeExistValidator,
          useValue: {
            validate: jest.fn(),
          },
        },
        {
          provide: CheckAssetTypeNameExistValidator,
          useValue: {
            validate: jest.fn(),
          },
        },
        {
          provide: AssetTypeRelationRepository,
          useValue: mockAssetTypeRelationRepository,
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
        {
          provide: FilterRepository,
          useValue: mockFilterRepository,
        },
        {
          provide: FilterService,
          useValue: mockFilterService,
        },
      ],
    }).compile();

    service = module.get<AssetTypeService>(AssetTypeService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw BadRequestException if asset type already exists', async () => {
      mockAssetTypeRepository.findAll.mockResolvedValue([{ id: 'existing-1' }]);

      await expect(
        service.create({
          name: 'Existing Asset',
          code: 'EXIST123',
          hasLocation: false,
          content: {},
          assetCategoryId: '1',
          assetFilterIds: [],
          assetRelationIds: [],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockAssetTypeRepository.findAll).toHaveBeenCalledWith({
        where: [{ code: 'EXIST123' }, { name: 'Existing Asset' }],
      });
    });
  });

  describe('updateAssetTypeIcon', () => {
    it('should upload and update icon', async () => {
      const file = {
        originalname: 'icon.png',
        mimetype: 'image/png',
        buffer: Buffer.from('123'),
      } as Express.Multer.File;

      const expectedPath = 'files/assetType/icons/123456-icon.png';
      jest
        .spyOn(service as any, 'handleIconUpload')
        .mockResolvedValue(expectedPath);
      mockAssetTypeRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateAssetTypeIcon('asset-1', file);

      expect(result).toEqual({ affected: 1 });
      expect(mockAssetTypeRepository.update).toHaveBeenCalledWith(
        { id: 'asset-1' },
        { iconPath: expectedPath },
      );
    });

    it('should throw error for invalid icon', async () => {
      const badFile = {
        originalname: 'icon.txt',
        mimetype: 'text/plain',
        buffer: Buffer.from('not an image'),
      } as unknown as Express.Multer.File;

      await expect((service as any).handleIconUpload(badFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
