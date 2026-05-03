import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { AssessmentTypeRepositoryMock } from 'src/assessment/__mocks__/assessment-type.repository';
import { AssessmentTypeRepository } from 'src/assessment/repositories/assessment-type.repository';
import { TestCaseGroupRepositoryMock } from '../__mocks__/test-case-group.repository';
import { TestCaseItemRepositoryMock } from '../__mocks__/test-case-item.repository';
import { CreateTestcaseGroupDto } from '../dto/input/create-test-case-group.dto';
import { TestcaseGroup } from '../entities/testcase-group.entity';
import { TestcaseGroupRepository } from '../repositories/testcase-group.repository';
import { TestcaseItemRepository } from '../repositories/testcase-item.repository';
import { TestcaseGroupService } from './test-case-group.service';

describe('TestcaseGroupService', () => {
  let service: TestcaseGroupService;
  let repository: typeof TestCaseGroupRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestcaseGroupService,
        {
          provide: TestcaseGroupRepository,
          useValue: TestCaseGroupRepositoryMock,
        },
        {
          provide: TestcaseItemRepository,
          useValue: TestCaseItemRepositoryMock,
        },
        {
          provide: AssessmentTypeRepository,
          useValue: AssessmentTypeRepositoryMock,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key) => `translated:${key}`),
          },
        },
      ],
    }).compile();

    service = module.get<TestcaseGroupService>(TestcaseGroupService);
    repository = module.get(TestcaseGroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an test case group', async () => {
      const testCase = {
        id: '1',
        name: 'string',
        nameFa: 'string',
      } as CreateTestcaseGroupDto;

      repository.save.mockResolvedValue(testCase);
      const result = await service.create(testCase);

      expect(result).toEqual(testCase);
      expect(repository.save).toHaveBeenCalledWith(testCase);
    });
  });

  describe('findOne', () => {
    it('should find one test case group', async () => {
      const testCase = {
        id: '1',
      } as TestcaseGroup;

      repository.findOne.mockResolvedValue(testCase);
      const result = await service.findOne({
        where: { id: '1' },
      });

      expect(result).toEqual(testCase);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: { assessmentType: { assessmentLayers: true } },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findAll', () => {
    it('should find all test case group', async () => {
      const testCases = [
        {
          id: '1',
        },
      ] as TestcaseGroup[];

      repository.findAll.mockResolvedValue(testCases);
      const result = await service.findAll();

      expect(result).toEqual(testCases);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an test case group', async () => {
      const updateData = { nameFa: '9867' };

      repository.update.mockResolvedValue(null);
      await service.update({ id: '1' }, updateData);

      expect(repository.update).toHaveBeenCalledWith({ id: '1' }, updateData);
    });
  });

  describe('remove', () => {
    it('should remove an test case group', async () => {
      repository.findAndDelete.mockResolvedValue(null);

      await service.remove('1');
      expect(repository.findAndDelete).toHaveBeenCalledWith({
        id: '1',
      });
    });
  });

  describe('findAllPagination', () => {
    it('should find all test case group with pagination', async () => {
      const testCases = [
        {
          id: '1',
        },
      ] as TestcaseGroup[];

      repository.findAllPagination.mockResolvedValue([testCases, 2]);
      const result = await service.findAllPagination({ skip: 0, take: 10 });

      expect(result).toEqual([testCases, 2]);
      expect(repository.findAllPagination).toHaveBeenCalled();
    });
  });
});
