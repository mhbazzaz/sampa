import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { ActionLogBufferServiceMock } from 'src/action-log/__mock__/action-log-buffer.service';
import { ActionLogBufferService } from 'src/action-log/services/action-log-buffer.service';
import { AssessmentRequestRepositoryMock } from 'src/assessment/__mocks__/assessment-request.repository';
import { AssessmentRequestRepository } from 'src/assessment/repositories/assessment-request.repository';
import { ContentStatus } from 'src/common/enums/test-case-content-status.enum';
import { ContentCriticality } from 'src/common/enums/test-case-criticality.enum';
import { TestCaseContentRepositoryMock } from '../__mocks__/test-case-content.repository';
import { TestCaseItemRepositoryMock } from '../__mocks__/test-case-item.repository';
import { CreateTestcaseContentDto } from '../dto/input/create-test-case-content.dto';
import { UpdateTestcaseContentDto } from '../dto/input/update-test-case-content.dto';
import { TestcaseContent } from '../entities/testcase-content.entity';
import { TestcaseContentRepository } from '../repositories/test-case-content.repository';
import { TestcaseItemRepository } from '../repositories/testcase-item.repository';
import { TestcaseContentService } from './test-case-content.service';

describe('TestcaseContentService', () => {
  let service: TestcaseContentService;
  let repository: typeof TestCaseContentRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestcaseContentService,
        {
          provide: TestcaseContentRepository,
          useValue: TestCaseContentRepositoryMock,
        },
        {
          provide: TestcaseItemRepository,
          useValue: TestCaseItemRepositoryMock,
        },
        {
          provide: AssessmentRequestRepository,
          useValue: AssessmentRequestRepositoryMock,
        },
        {
          provide: ActionLogBufferService,
          useValue: ActionLogBufferServiceMock,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key) => `translated:${key}`),
          },
        },
      ],
    }).compile();

    service = module.get<TestcaseContentService>(TestcaseContentService);
    repository = module.get(TestcaseContentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a testcase content when status is "failed" and criticality is provided', async () => {
      const dto: CreateTestcaseContentDto = {
        proves: 'proof',
        suggestions: 'suggestion',
        status: ContentStatus.Failed,
        criticality: ContentCriticality.Blocker,
        observations: 'obs',
        references: 'ref',
      };

      const savedEntity = { id: '1', ...dto };
      repository.save.mockResolvedValue(savedEntity);

      const result = await service.create(dto);

      expect(result).toEqual(savedEntity);
      expect(repository.save).toHaveBeenCalledWith(dto);
    });

    it('should create a testcase content when status is "accepted" and criticality is NOT provided', async () => {
      const dto: CreateTestcaseContentDto = {
        proves: 'proof',
        suggestions: 'suggestion',
        status: ContentStatus.Accepted,
        observations: 'obs',
        references: 'ref',
      };

      const savedEntity = { id: '1', ...dto };
      repository.save.mockResolvedValue(savedEntity);

      const result = await service.create(dto);

      expect(result).toEqual(savedEntity);
      expect(repository.save).toHaveBeenCalledWith(dto);
    });

    it('should throw BadRequestException when status is "accepted" but criticality is provided', async () => {
      const dto: CreateTestcaseContentDto = {
        observations: 'test-observations',
        references: 'test-references',
        proves: 'proof',
        suggestions: 'suggestion',
        status: ContentStatus.Accepted,
        criticality: ContentCriticality.Medium,
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when status is "failed" but criticality is missing', async () => {
      const dto: CreateTestcaseContentDto = {
        observations: 'test-observations',
        references: 'test-references',
        proves: 'proof',
        suggestions: 'suggestion',
        status: ContentStatus.Failed,
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update testcase content when changing status to "notPerforming" with criticality', async () => {
      const updateDto: UpdateTestcaseContentDto = {
        status: ContentStatus.NotPerforming,
        criticality: ContentCriticality.Blocker,
      };

      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValue({
        id: '1',
        status: ContentStatus.NotPerforming,
        criticality: ContentCriticality.Blocker,
      });

      await service.update({ id: '1' }, updateDto);

      expect(repository.update).toHaveBeenCalledWith(
        { id: '1' },
        expect.objectContaining(updateDto),
      );
    });

    it('should update testcase content when setting status to "accepted" without criticality', async () => {
      const updateDto: UpdateTestcaseContentDto = {
        status: ContentStatus.Accepted,
        // no criticality → valid
      };

      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValue({
        id: '1',
        status: ContentStatus.Accepted,
      });

      await service.update({ id: '1' }, updateDto);

      expect(repository.update).toHaveBeenCalledWith(
        { id: '1' },
        expect.objectContaining({ status: ContentStatus.Accepted }),
      );
    });

    it('should throw BadRequestException when updating status to "accepted" but criticality is provided', async () => {
      const updateDto: UpdateTestcaseContentDto = {
        status: ContentStatus.Accepted,
        criticality: ContentCriticality.Medium, // ❌ not allowed
      };

      await expect(service.update({ id: '1' }, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when updating status to "failed" without criticality', async () => {
      const updateDto: UpdateTestcaseContentDto = {
        status: ContentStatus.Failed,
        // criticality missing → ❌
      };

      await expect(service.update({ id: '1' }, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    // Keep your original generic update test if needed (but it's not realistic)
    it('should allow unrelated updates (e.g., userId) without status/criticality', async () => {
      const updateData = { userId: '9867' } as Partial<TestcaseContent>;
      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValue({ id: '1' });

      await service.update({ id: '1' }, updateData);

      expect(repository.update).toHaveBeenCalledWith({ id: '1' }, updateData);
    });
  });
  describe('findOne', () => {
    it('should find one test case content', async () => {
      const testCase = {
        id: '1',
      } as TestcaseContent;

      repository.findOne.mockResolvedValue(testCase);
      const result = await service.findOne({
        where: { id: '1' },
      });

      expect(result).toEqual(testCase);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: {
          assessmentRequest: true,
          testcaseItem: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should find all test case content', async () => {
      const testCases = [
        {
          id: '1',
        },
      ] as TestcaseContent[];

      repository.findAll.mockResolvedValue(testCases);
      const result = await service.findAll();

      expect(result).toEqual(testCases);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an test case content', async () => {
      repository.findAndDelete.mockResolvedValue(null);

      await service.remove('1');
      expect(repository.findAndDelete).toHaveBeenCalledWith({
        id: '1',
      });
    });
  });

  describe('findAllPagination', () => {
    it('should find all test case content with pagination', async () => {
      const testCases = [
        {
          id: '1',
        },
      ] as TestcaseContent[];

      repository.findAllPagination.mockResolvedValue([testCases, 2]);
      const result = await service.findAllPagination({ skip: 0, take: 10 });

      expect(result).toEqual([testCases, 2]);
      expect(repository.findAllPagination).toHaveBeenCalled();
    });
  });
});
