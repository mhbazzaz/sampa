import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { AssessmentLayerRepository } from 'src/assessment/repositories/assessment-layer.repository';
import { AssessmentTypeRepository } from 'src/assessment/repositories/assessment-type.repository';
import { AssetTypeRepository } from 'src/asset/repositories/asset-type.repository';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { EnvironmentRepository } from 'src/environment/repositories/environment.repository';
import { RequestSpecItemRepository } from '../repositories/request-spec-item.repository';
import { RequestSpecItemService } from './request-spec-item.service';
import { ActionLogBufferService } from 'src/action-log/services/action-log-buffer.service';
import { ActionLogBufferServiceMock } from 'src/action-log/__mock__/action-log-buffer.service';

describe('RequestSpecItemService', () => {
  let service: RequestSpecItemService;
  // let requestSpecItemRepository: jest.Mocked<RequestSpecItemRepository>;
  // let validationService: jest.Mocked<ValidationService>;
  // let assetTypeRepository: jest.Mocked<AssetTypeRepository>;
  // let environmentRepository: jest.Mocked<EnvironmentRepository>;
  // let assessmentLayerRepository: jest.Mocked<AssessmentLayerRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestSpecItemService,
        {
          provide: RequestSpecItemRepository,
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            findAndDelete: jest.fn(),
            findFilteredRequestSpecItems: jest.fn(),
            findAllPagination: jest.fn(),
          },
        },
        {
          provide: ValidationService,
          useValue: {
            validateSchema: jest.fn(),
          },
        },
        {
          provide: AssetTypeRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: EnvironmentRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AssessmentLayerRepository,
          useValue: {
            findAllFiltered: jest.fn(),
          },
        },
        {
          provide: AssessmentTypeRepository,
          useValue: {
            update: jest.fn(),
          },
        },
        {
          provide: ActionLogBufferService,
          useValue: ActionLogBufferServiceMock,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RequestSpecItemService>(RequestSpecItemService);
    // requestSpecItemRepository = module.get(RequestSpecItemRepository);
    // validationService = module.get(ValidationService);
    // assetTypeRepository = module.get(AssetTypeRepository);
    // environmentRepository = module.get(EnvironmentRepository);
    // assessmentLayerRepository = module.get(AssessmentLayerRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // describe('create', () => {
  //   it('should validate schema, check relations, and save data', async () => {
  //     const dto: CreateSpecItemDto = {
  //       assetTypeId: '1',
  //       environmentId: '2',
  //       value: { key: 'value' },
  //       isMultiValue: true,
  //       isOptional: false,
  //       requestSpecContents: [],
  //       name: 'a',
  //       description: 'b',
  //     };

  //     const mockAssetType = { id: '1', name: 'AssetType1' };
  //     const mockEnvironment = { id: '2', name: 'Environment1' };
  //     const mockAssessmentLayers = [
  //       { id: 'uuid-1234', name: 'Layer1' },
  //       { id: 'uuid-5678', name: 'Layer2' },
  //     ];
  //     const savedItem = {
  //       id: '123',
  //       ...dto,
  //       value: JSON.stringify(dto.value),
  //     };

  //     validationService.validateSchema.mockResolvedValueOnce(true);
  //     assetTypeRepository.findOne.mockResolvedValueOnce(mockAssetType);
  //     environmentRepository.findOne.mockResolvedValueOnce(mockEnvironment);
  //     assessmentLayerRepository.findAllFiltered.mockResolvedValueOnce(
  //       mockAssessmentLayers,
  //     );
  //     requestSpecItemRepository.save.mockResolvedValueOnce(savedItem);

  //     const result = await service.create(dto);

  //     expect(validationService.validateSchema).toHaveBeenCalledWith(dto.value);
  //     expect(assetTypeRepository.findOne).toHaveBeenCalledWith({
  //       where: { id: '1' },
  //     });
  //     expect(environmentRepository.findOne).toHaveBeenCalledWith({
  //       where: { id: '2' },
  //     });
  //     expect(assessmentLayerRepository.findAllFiltered).toHaveBeenCalledWith({
  //       where: { id: ['uuid-1234', 'uuid-5678'] },
  //       order: { createdAt: 'ASC' },
  //     });
  //     expect(requestSpecItemRepository.save).toHaveBeenCalledWith({
  //       ...dto,
  //       value: JSON.stringify(dto.value),
  //     });
  //     expect(result).toEqual(savedItem);
  //   });

  //   it('should throw NotFoundException if assetTypeId is invalid', async () => {
  //     const dto: CreateSpecItemDto = {
  //       assetTypeId: 'invalid-id',
  //       environmentId: '2',
  //       value: { key: 'value' },
  //       isMultiValue: true,
  //       isOptional: false,
  //       requestSpecContents: [],
  //       assessmentLayerIds: ['uuid-1234', 'uuid-5678'],
  //     };

  //     validationService.validateSchema.mockResolvedValueOnce(true);
  //     assetTypeRepository.findOne.mockResolvedValueOnce(null);

  //     await expect(service.create(dto)).rejects.toThrow(
  //       new NotFoundException(`AssetType with ID invalid-id not found`),
  //     );

  //     expect(assetTypeRepository.findOne).toHaveBeenCalledWith({
  //       where: { id: 'invalid-id' },
  //     });
  //   });

  //   it('should throw NotFoundException if any assessmentLayerId is invalid', async () => {
  //     const dto: CreateSpecItemDto = {
  //       assetTypeId: '1',
  //       environmentId: '2',
  //       value: { key: 'value' },
  //       isMultiValue: true,
  //       isOptional: false,
  //       requestSpecContents: [],
  //       assessmentLayerIds: ['uuid-1234', 'invalid-uuid'],
  //     };

  //     const mockAssetType = { id: '1', name: 'AssetType1' };

  //     validationService.validateSchema.mockResolvedValueOnce(true);
  //     assetTypeRepository.findOne.mockResolvedValueOnce(mockAssetType);
  //     assessmentLayerRepository.findAllFiltered.mockResolvedValueOnce([
  //       { id: 'uuid-1234', name: 'Layer1' },
  //     ]);

  //     await expect(service.create(dto)).rejects.toThrow(
  //       new NotFoundException(`One or more AssessmentLayer IDs are invalid`),
  //     );

  //     expect(assessmentLayerRepository.findAllFiltered).toHaveBeenCalledWith({
  //       where: { id: ['uuid-1234', 'invalid-uuid'] },
  //       order: { createdAt: 'ASC' },
  //     });
  //   });
  // });
});
