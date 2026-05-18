import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { CreateLocationTypeDto } from '../dto/input/create-location-type.dto';
import {
  LocationType,
  LocationTypeCategoryEnum,
} from '../entities/location-type.entity';
import { LocationTypeRepository } from '../repositories/location-type.repository';
import { LocationTypeService } from './location-type.service';

describe('LocationTypeService', () => {
  let service: LocationTypeService;
  let locationTypeRepository: jest.Mocked<LocationTypeRepository>;
  let i18nService: jest.Mocked<I18nService>;

  const mockLocationType = {
    id: '1',
    name: 'Warehouse',
    category: LocationTypeCategoryEnum.PHYSICAL,
    locations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
    _v: 1,
  } as LocationType;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationTypeService,
        {
          provide: LocationTypeRepository,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            findAndDelete: jest.fn(),
            findAllPagination: jest.fn(),
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

    service = module.get<LocationTypeService>(LocationTypeService);
    locationTypeRepository = module.get(LocationTypeRepository);
    i18nService = module.get(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateLocationTypeDto = {
      name: 'Warehouse',
      category: LocationTypeCategoryEnum.PHYSICAL,
    };

    it('should create a location type successfully', async () => {
      locationTypeRepository.save.mockResolvedValue(mockLocationType);

      const result = await service.create(createDto);

      expect(result).toEqual(mockLocationType);
      expect(locationTypeRepository.save).toHaveBeenCalledWith(createDto);
    });

    it('should create a location type with optional fields', async () => {
      const dtoWithOptionalFields = {
        ...createDto,
        description: 'Large storage facility',
        metadata: { capacity: 1000 },
      };
      const expectedResult = { ...mockLocationType, ...dtoWithOptionalFields };
      locationTypeRepository.save.mockResolvedValue(expectedResult);

      const result = await service.create(dtoWithOptionalFields);

      expect(result).toEqual(expectedResult);
      expect(locationTypeRepository.save).toHaveBeenCalledWith(
        dtoWithOptionalFields,
      );
    });
  });

  describe('findOne', () => {
    it('should find one location type with options', async () => {
      const options = { where: { id: '1' } };
      locationTypeRepository.findOne.mockResolvedValue(mockLocationType);

      const result = await service.findOne(options);

      expect(result).toEqual(mockLocationType);
      expect(locationTypeRepository.findOne).toHaveBeenCalledWith(options);
    });

    it('should return null if location type not found', async () => {
      const options = { where: { id: 'nonexistent' } };
      locationTypeRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(options);

      expect(result).toBeNull();
      expect(locationTypeRepository.findOne).toHaveBeenCalledWith(options);
    });
  });

  describe('findAll', () => {
    it('should return all location types', async () => {
      const locationTypes = [
        mockLocationType,
        { ...mockLocationType, id: '2' },
      ];
      locationTypeRepository.findAll.mockResolvedValue(locationTypes);

      const result = await service.findAll();

      expect(result).toEqual(locationTypes);
      expect(locationTypeRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array if no location types exist', async () => {
      locationTypeRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(locationTypeRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update location type', async () => {
      const where = { id: '1' };
      const updateData = { name: 'Updated Warehouse' };
      const updateResult = { affected: 1 } as any;
      locationTypeRepository.update.mockResolvedValue(updateResult);

      const result = await service.update(where, updateData);

      expect(result).toEqual(updateResult);
      expect(locationTypeRepository.update).toHaveBeenCalledWith(
        where,
        updateData,
      );
    });

    it('should update location type with multiple fields', async () => {
      const where = { id: '1' };
      const updateData = {
        name: 'Updated Warehouse',
        category: LocationTypeCategoryEnum.PHYSICAL,
        description: 'Updated description',
      };
      const updateResult = { affected: 1 } as any;
      locationTypeRepository.update.mockResolvedValue(updateResult);

      const result = await service.update(where, updateData);

      expect(result).toEqual(updateResult);
      expect(locationTypeRepository.update).toHaveBeenCalledWith(
        where,
        updateData,
      );
    });
  });
});
