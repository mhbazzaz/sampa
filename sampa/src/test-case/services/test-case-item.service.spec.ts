import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import * as sanitizeHtml from 'sanitize-html';
import { TestCaseItemRepositoryMock } from '../__mocks__/test-case-item.repository';
import { CreateTestcaseItemDto } from '../dto/input/create-test-case-item.dto';
import { TestcaseItem } from '../entities/testcase-item.entity';
import { TestcaseItemRepository } from '../repositories/testcase-item.repository';
import { TestcaseItemService } from './test-case-item.service';

const sanitizeConfig = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'data'],
};

describe('TestcaseItemService', () => {
  let service: TestcaseItemService;
  let repository: typeof TestCaseItemRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestcaseItemService,
        {
          provide: TestcaseItemRepository,
          useValue: TestCaseItemRepositoryMock,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key) => `translated:${key}`),
          },
        },
      ],
    }).compile();

    service = module.get<TestcaseItemService>(TestcaseItemService);
    repository = module.get(TestcaseItemRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an test case item', async () => {
      const testCase = {
        id: '1',
        name: 'string',
        nameFa: 'string',
        objective: 'string',
        approach: 'string',
        methodology: 'string',
        observationsDefault: 'string',
        referencesDefault: 'string',
        suggestionDefault: 'string',
        isMultiValue: true,
        provesDefault: 'string',
        isOptional: true,
        isEnabled: true,
      } as CreateTestcaseItemDto;

      testCase.provesDefault = sanitizeHtml(
        testCase.provesDefault || '',
        sanitizeConfig,
      );
      testCase.suggestionDefault = sanitizeHtml(
        testCase.suggestionDefault || '',
        sanitizeConfig,
      );

      repository.createTransactional.mockResolvedValue(testCase);
      const result = await service.create(testCase);

      expect(result).toEqual(testCase);
      expect(repository.createTransactional).toHaveBeenCalledWith(testCase);
    });
  });

  describe('findOne', () => {
    it('should find one test case item', async () => {
      const testCase = {
        id: '1',
      } as TestcaseItem;

      repository.findOneWithEnabledRelations.mockResolvedValue(testCase);
      const result = await service.findOne('1');

      expect(result).toEqual(testCase);
      expect(repository.findOneWithEnabledRelations).toHaveBeenCalledWith('1');
    });
  });

  describe('findAll', () => {
    it('should find all test case item', async () => {
      const testCases = [
        {
          id: '1',
        },
      ] as TestcaseItem[];

      repository.findAllWithEnabledRelations.mockResolvedValue(testCases);
      const result = await service.findAll();

      expect(result).toEqual(testCases);
      expect(repository.findAllWithEnabledRelations).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an test case item', async () => {
      const updateData = {
        nameFa: '9867',
        observationsDefault: 'string',
        provesDefault: 'string',
        referencesDefault: 'string',
        suggestionDefault: 'string',
      };

      if (updateData.provesDefault) {
        updateData.provesDefault = sanitizeHtml(
          updateData.provesDefault || '',
          sanitizeConfig,
        );
      }

      if (updateData.suggestionDefault) {
        updateData.suggestionDefault = sanitizeHtml(
          updateData.suggestionDefault || '',
          sanitizeConfig,
        );
      }

      repository.update.mockResolvedValue(null);
      await service.update({ id: '1' }, updateData);

      expect(repository.updateTransactional).toHaveBeenCalledWith(
        { id: '1' },
        updateData,
      );
    });
  });

  describe('remove', () => {
    it('should remove an test case item', async () => {
      repository.findAndDelete.mockResolvedValue(null);
      repository.findOne.mockResolvedValue({});

      await service.remove('1');
      expect(repository.findAndDelete).toHaveBeenCalledWith({
        id: '1',
      });
    });
  });

  describe('findAllPagination', () => {
    it('should find all test case item with pagination', async () => {
      const testCases = [
        {
          id: '1',
        },
      ] as TestcaseItem[];

      repository.findAllPagination.mockResolvedValue([testCases, 2]);
      const result = await service.findAllPagination({ skip: 0, take: 10 });

      expect(result).toEqual([testCases, 2]);
      expect(repository.findAllPagination).toHaveBeenCalled();
    });
  });
});
