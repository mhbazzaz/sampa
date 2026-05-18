import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { AssetService } from 'src/asset/services/asset.service';
import { LocationTypeRepository } from 'src/location-type/repositories/location-type.repository';
import { TagRepository } from 'src/tag/repositories/tag.repository';
import { CreateLocationDto } from '../dto/input/create-location.dto';
import { mockLocationRepository } from '../repositories/__mocks__/location.repository';
import { LocationRepository } from '../repositories/location.repository';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;
  let locationRepository: jest.Mocked<LocationRepository>;
  let assetService: jest.Mocked<AssetService>;
  let locationTypeRepository: jest.Mocked<LocationTypeRepository>;
  let tagRepository: jest.Mocked<TagRepository>;
  let i18nService: jest.Mocked<I18nService>;

  const mockLocation = {
    id: '1',
    name: 'Test Location',
    code: 'TEST001',
    exCode: 'EXT001',
    address: 'Test Address',
    parentId: null,
    locationTypeId: 'type-1',
    tags: [],
    children: [],
    assetVersions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
    _v: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: LocationRepository,
          useValue: mockLocationRepository,
        },
        {
          provide: LocationTypeRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AssetService,
          useValue: {
            findAssetVersionsByLocationId: jest.fn(),
          },
        },
        {
          provide: TagRepository,
          useValue: {
            findAll: jest.fn(),
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

    service = module.get<LocationService>(LocationService);
    locationRepository = module.get(LocationRepository);
    locationTypeRepository = module.get(LocationTypeRepository);
    tagRepository = module.get(TagRepository);
    assetService = module.get(AssetService);
    i18nService = module.get(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateLocationDto = {
      name: 'Test Location',
      code: 'TEST001',
      exCode: 'TEST001-1',
      address: 'Test Address',
      locationTypeId: 'type-1',
      parentId: 'id-2',
      tagIds: [],
    };

    it('should throw BadRequestException if parent not found', async () => {
      const dtoWithParent = { ...createDto, parentId: 'invalid-parent' };
      locationRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dtoWithParent)).rejects.toThrow(
        BadRequestException,
      );
      expect(locationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'invalid-parent' },
      });
    });

    it('should throw BadRequestException if location type not found', async () => {
      locationTypeRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should find one location with options', async () => {
      const options = { where: { id: '1' } };
      locationRepository.findOne.mockResolvedValue(mockLocation);

      const result = await service.findOne(options);

      expect(result).toEqual(mockLocation);
      expect(locationRepository.findOne).toHaveBeenCalledWith(options);
    });
  });

  describe('findAll', () => {
    it('should return all locations', async () => {
      locationRepository.findAll.mockResolvedValue([mockLocation]);

      const result = await service.findAll();

      expect(result).toEqual([mockLocation]);
      expect(locationRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update location', async () => {
      const where = { id: '1' };
      const updateData = { name: 'Updated Name' };
      locationRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.update(where, updateData);

      expect(locationRepository.update).toHaveBeenCalledWith(where, updateData);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if location not found', async () => {
      locationRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if location has children', async () => {
      const locationWithChildren = {
        ...mockLocation,
        children: [{} as any],
        assetVersions: [],
      };
      locationRepository.findOne.mockResolvedValue(locationWithChildren);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if location has asset versions', async () => {
      const locationWithAssets = {
        ...mockLocation,
        children: [],
        assetVersions: [{} as any],
      };
      locationRepository.findOne.mockResolvedValue(locationWithAssets);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findBaseLocations', () => {
    // it('should return base locations (without parent)', async () => {
    //   locationRepository.findAll.mockResolvedValue([mockLocation]);
    //   const result = await service.findBaseLocations();
    //   expect(result).toEqual([mockLocation]);
    //   expect(locationRepository.findAll).toHaveBeenCalledWith({
    //     where: { parentId: IsNull() },
    //     relations: { locationType: true, tags: true },
    //   });
    // });
  });

  describe('findOneLocation', () => {
    it('should return a location with full relations', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation);

      const result = await service.findOneLocation('1');

      expect(result).toEqual(mockLocation);
      expect(locationRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: { locationType: true, tags: true, parent: true },
      });
    });
  });

  describe('findOneLocationUser', () => {
    it('should return a location with full relations for user', async () => {
      locationRepository.findOne.mockResolvedValue(mockLocation);

      const result = await service.findOneLocationUser('1');

      expect(result).toEqual(mockLocation);
      expect(locationRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: { locationType: true, tags: true, parent: true },
      });
    });
  });
});
