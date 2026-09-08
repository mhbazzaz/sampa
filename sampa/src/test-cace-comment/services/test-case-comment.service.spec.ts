import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { MemberRepositoryMock } from 'src/member/__mocks__/member.repository';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
import { Role } from 'src/role/entities/role.entity';
import { TestCaseContentRepositoryMock } from 'src/test-case/__mocks__/test-case-content.repository';
import { TestcaseContent } from 'src/test-case/entities/testcase-content.entity';
import { TestcaseContentRepository } from 'src/test-case/repositories/test-case-content.repository';
import { TestCaseCommentRepositoryMock } from '../__mocks__/test-case-comment.repository';
import { TestCaseComment } from '../entities/test-case-comment.entity';
import { TestCaseCommentRepository } from '../repositories/test-case-comment.repository';
import { TestCaseCommentService } from './test-case-comment.service';

describe('TestcaseCommentService', () => {
  let service: TestCaseCommentService;
  let repository: typeof TestCaseCommentRepositoryMock;
  let testcaseContentrepository: jest.Mocked<TestcaseContentRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestCaseCommentService,
        {
          provide: TestCaseCommentRepository,
          useValue: TestCaseCommentRepositoryMock,
        },
        {
          provide: MemberRepository,
          useValue: MemberRepositoryMock,
        },
        {
          provide: TestcaseContentRepository,
          useValue: TestCaseContentRepositoryMock,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key) => `translated:${key}`),
          },
        },
      ],
    }).compile();

    service = module.get<TestCaseCommentService>(TestCaseCommentService);
    repository = module.get(TestCaseCommentRepository);
    testcaseContentrepository = module.get(TestcaseContentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('TestCaseCommentService', () => {
    let service: TestCaseCommentService;
    let testCaseCommentRepositoryMock: jest.Mocked<TestCaseCommentRepository>;
    let memberRepositoryMock: jest.Mocked<MemberRepository>;
    let i18nServiceMock: jest.Mocked<I18nService>;

    const mockRole = { id: 'role-1', name: 'user' } as Role;

    const mockMember = {
      id: 'member-1',
      roles: [mockRole],
    } as Member;

    const mockTestCaseComment = {
      id: 'testcase-comment-1',
      memberId: 'member-1',
      testcaseContentId: 'testcase-1',
      roleId: 'role-1',
      comment: 'Test testcase comment',
      createdAt: new Date(),
      updatedAt: new Date(),
      member: mockMember,
      role: mockRole,
      testcaseContent: {} as TestcaseContent,
    } as TestCaseComment;

    beforeEach(async () => {
      testCaseCommentRepositoryMock = {
        save: jest.fn(),
        findOne: jest.fn(),
        findAll: jest.fn(),
        update: jest.fn(),
        findAndDelete: jest.fn(),
        findAllPagination: jest.fn(),
      } as unknown as jest.Mocked<TestCaseCommentRepository>;

      memberRepositoryMock = {
        findOne: jest.fn(),
      } as unknown as jest.Mocked<MemberRepository>;

      i18nServiceMock = {
        t: jest.fn().mockImplementation((key) => `translated:${key}`),
      } as unknown as jest.Mocked<I18nService>;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TestCaseCommentService,
          {
            provide: TestCaseCommentRepository,
            useValue: testCaseCommentRepositoryMock,
          },
          {
            provide: TestcaseContentRepository,
            useValue: TestCaseContentRepositoryMock,
          },
          {
            provide: MemberRepository,
            useValue: memberRepositoryMock,
          },
          {
            provide: I18nService,
            useValue: i18nServiceMock,
          },
        ],
      }).compile();

      service = module.get<TestCaseCommentService>(TestCaseCommentService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    // describe('create', () => {
    //   it('should create a new testcase comment', async () => {
    //     const createDto = {
    //       testcaseContentId: 'testcase-1',
    //       comment: 'New testcase comment',
    //     };

    //     // Service refetches member from DB, so mock the repository response
    //     const fetchedMember = {
    //       id: 'member-1',
    //       roles: [{ id: 'role-1', name: 'user' }],
    //     };
    //     memberRepositoryMock.findOne.mockResolvedValueOnce(
    //       fetchedMember as Member,
    //     );
    //     testCaseCommentRepositoryMock.save.mockResolvedValueOnce(
    //       mockTestCaseComment,
    //     );

    //     const result = await service.create(createDto, {
    //       id: 'member-1',
    //     } as Member);

    //     expect(memberRepositoryMock.findOne).toHaveBeenCalledWith({
    //       where: { id: 'member-1' },
    //       relations: { roles: true },
    //     });

    //     expect(result).toEqual(mockTestCaseComment);
    //   });
    // });

    describe('findOne', () => {
      it('should find one testcase comment', async () => {
        const options = { where: { id: 'testcase-comment-1' } };
        testCaseCommentRepositoryMock.findOne.mockResolvedValueOnce(
          mockTestCaseComment,
        );

        const result = await service.findOne(options);

        expect(testCaseCommentRepositoryMock.findOne).toHaveBeenCalledWith(
          options,
        );
        expect(result).toEqual(mockTestCaseComment);
      });
    });

    describe('findAll', () => {
      it('should return all testcase comments', async () => {
        const mockComments = [mockTestCaseComment];
        testCaseCommentRepositoryMock.findAll.mockResolvedValueOnce(
          mockComments,
        );

        const result = await service.findAll();

        expect(testCaseCommentRepositoryMock.findAll).toHaveBeenCalled();
        expect(result).toEqual(mockComments);
      });
    });

    describe('update', () => {
      it('should update a testcase comment', async () => {
        const where = { id: 'testcase-comment-1' };
        const updateData = { comment: 'Updated comment' };

        await service.update(where, updateData);

        expect(testCaseCommentRepositoryMock.update).toHaveBeenCalledWith(
          where,
          updateData,
        );
      });
    });

    describe('remove', () => {
      it('should delete a testcase comment', async () => {
        const where = { id: 'testcase-comment-1' };

        await service.remove(where);

        expect(
          testCaseCommentRepositoryMock.findAndDelete,
        ).toHaveBeenCalledWith(where);
      });
    });

    describe('findAllPagination', () => {
      it('should return paginated testcase comments with relations', async () => {
        const mockPaginatedResult: [TestCaseComment[], number] = [
          [mockTestCaseComment],
          1,
        ];
        testCaseCommentRepositoryMock.findAllPagination.mockResolvedValueOnce(
          mockPaginatedResult,
        );

        const result = await service.findAllPagination(0, 10, 'testcase-1');

        expect(
          testCaseCommentRepositoryMock.findAllPagination,
        ).toHaveBeenCalledWith(0, 10, {
          order: { createdAt: 'DESC' },
          where: { testcaseContentId: 'testcase-1' },
          relations: { member: true, role: true },
        });

        expect(result).toEqual(mockPaginatedResult);
      });
    });
  });
});
