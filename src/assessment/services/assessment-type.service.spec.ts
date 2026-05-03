import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentTypeRepositoryMock } from '../__mocks__/assessment-type.repository';
import { AssessmentType } from '../entities/assessment-type.entity';
import { AssessmentTypeRepository } from '../repositories/assessment-type.repository';
import { AssessmentTypeService } from './assessment-type.service';

describe('AssessmentTypeService', () => {
  let service: AssessmentTypeService;
  let repository: typeof AssessmentTypeRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentTypeService,
        {
          provide: AssessmentTypeRepository,
          useValue: AssessmentTypeRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<AssessmentTypeService>(AssessmentTypeService);
    repository = module.get(AssessmentTypeRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should find one assessment-type', async () => {
      const assessmentType = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        name: 'mohammad',
        _v: 1,
      };

      repository.findOne.mockResolvedValue(assessmentType);
      const result = await service.findOne({ where: { id: '1' } });

      expect(result).toEqual(assessmentType);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('findAll', () => {
    it('should find all assessment-type', async () => {
      const assessmentType = [
        {
          id: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          name: 'mohammad',
          _v: 1,
        },
        {
          id: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          name: 'ali',
          _v: 1,
        },
      ];

      repository.findAll.mockResolvedValue(assessmentType);
      const result = await service.findAll();

      expect(result).toEqual(assessmentType);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an assessment-type', async () => {
      const assessmentType = {
        name: 'mohammad',
      } as Partial<AssessmentType>;

      repository.update.mockResolvedValue(null);
      await service.update({ id: '1' }, assessmentType);

      expect(repository.update).toHaveBeenCalledWith(
        { id: '1' },
        assessmentType,
      );
    });
  });

  describe('remove', () => {
    it('should remove an assessment-type', async () => {
      repository.findAndDelete.mockResolvedValue(null);
      await service.remove({ id: '1' });

      expect(repository.findAndDelete).toHaveBeenCalledWith({ id: '1' });
    });
  });

  describe('findAllPagination', () => {
    it('should find all assessment-type with pagination', async () => {
      const AssessmentType = [
        {
          id: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          name: 'mohammad',
          _v: 1,
        },
        {
          id: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          name: 'ali',
          _v: 1,
        },
      ];

      repository.findAllPagination.mockResolvedValue(AssessmentType);
      const result = await service.findAllPagination(0, 10);

      expect(result).toEqual(AssessmentType);
    });
  });
});
