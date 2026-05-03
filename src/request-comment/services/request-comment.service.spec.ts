import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { MemberRepositoryMock } from 'src/member/__mocks__/member.repository';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
import { DeepPartial } from 'typeorm';
import { RequestCommentRepositoryMock } from '../__mocks__/request-comment.repository';
import { RequestComment } from '../entities/request-comment.entity';
import { RequestCommentRepository } from '../repositories/request-comment.repository';
import { RequestCommentService } from './request-comment.service';

describe('RequestCommentService', () => {
  let service: RequestCommentService;
  let repository: typeof RequestCommentRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestCommentService,
        {
          provide: RequestCommentRepository,
          useValue: RequestCommentRepositoryMock,
        },
        {
          provide: MemberRepository,
          useValue: MemberRepositoryMock,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key) => `translated:${key}`),
          },
        },
      ],
    }).compile();

    service = module.get<RequestCommentService>(RequestCommentService);
    repository = module.get(RequestCommentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('RequestCommentService', () => {
    let service: RequestCommentService;
    let requestCommentRepositoryMock: jest.Mocked<RequestCommentRepository>;
    let memberRepositoryMock: jest.Mocked<MemberRepository>;
    let i18nServiceMock: jest.Mocked<I18nService>;

    const mockMember = {
      id: 'member-1',
      roles: [{ id: 'role-1', name: 'user' }],
    } as Member;

    const mockRequestComment = {
      id: 'comment-1',
      memberId: 'member-1',
      requestId: 'request-1',
      roleId: 'role-1',
      comment: 'Test comment',
      createdAt: new Date(),
      updatedAt: new Date(),
      member: mockMember,
      role: mockMember.roles![0],
      request: {} as AssessmentRequest,
    } as RequestComment;

    beforeEach(async () => {
      requestCommentRepositoryMock = {
        save: jest.fn(),
        findOne: jest.fn(),
        findAll: jest.fn(),
        update: jest.fn(),
        findAndDelete: jest.fn(),
        findAllPagination: jest.fn(),
      } as unknown as jest.Mocked<RequestCommentRepository>;

      memberRepositoryMock = {
        findOne: jest.fn(),
      } as unknown as jest.Mocked<MemberRepository>;

      i18nServiceMock = {
        t: jest.fn().mockImplementation((key) => `translated:${key}`),
      } as unknown as jest.Mocked<I18nService>;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RequestCommentService,
          {
            provide: RequestCommentRepository,
            useValue: requestCommentRepositoryMock,
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

      service = module.get<RequestCommentService>(RequestCommentService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('create', () => {
      it('should create a new request comment', async () => {
        const createDto: DeepPartial<RequestComment> = {
          requestId: 'request-1',
          comment: 'New comment',
        };

        memberRepositoryMock.findOne.mockResolvedValueOnce(mockMember);
        requestCommentRepositoryMock.save.mockResolvedValueOnce(
          mockRequestComment,
        );

        const result = await service.create(createDto, mockMember);

        expect(memberRepositoryMock.findOne).toHaveBeenCalledWith({
          where: { id: mockMember.id },
          relations: { roles: true },
        });
        expect(requestCommentRepositoryMock.save).toHaveBeenCalledWith({
          requestId: 'request-1',
          memberId: 'member-1',
          comment: 'New comment',
          roleId: 'role-1',
        });
        expect(result).toEqual(mockRequestComment);
      });

      it('should throw if member has no roles', async () => {
        const createDto: DeepPartial<RequestComment> = {
          requestId: 'request-1',
          comment: 'New comment',
        };

        const memberWithoutRoles = { ...mockMember, roles: [] };
        memberRepositoryMock.findOne.mockResolvedValueOnce(memberWithoutRoles);

        await expect(service.create(createDto, mockMember)).rejects.toThrow();
      });
    });

    describe('findOne', () => {
      it('should find one request comment', async () => {
        const options = { where: { id: 'comment-1' } };
        requestCommentRepositoryMock.findOne.mockResolvedValueOnce(
          mockRequestComment,
        );

        const result = await service.findOne(options);

        expect(requestCommentRepositoryMock.findOne).toHaveBeenCalledWith(
          options,
        );
        expect(result).toEqual(mockRequestComment);
      });
    });

    describe('findAll', () => {
      it('should return all request comments', async () => {
        const mockComments = [mockRequestComment];
        requestCommentRepositoryMock.findAll.mockResolvedValueOnce(
          mockComments,
        );

        const result = await service.findAll();

        expect(requestCommentRepositoryMock.findAll).toHaveBeenCalled();
        expect(result).toEqual(mockComments);
      });
    });

    describe('update', () => {
      it('should update a request comment', async () => {
        const where = { id: 'comment-1' };
        const updateData = { comment: 'Updated comment' };

        await service.update(where, updateData);

        expect(requestCommentRepositoryMock.update).toHaveBeenCalledWith(
          where,
          updateData,
        );
      });
    });

    describe('remove', () => {
      it('should delete a request comment', async () => {
        const where = { id: 'comment-1' };

        await service.remove(where);

        expect(requestCommentRepositoryMock.findAndDelete).toHaveBeenCalledWith(
          where,
        );
      });
    });

    describe('findAllPagination', () => {
      it('should return paginated request comments with relations', async () => {
        const mockPaginatedResult: [RequestComment[], number] = [
          [mockRequestComment],
          1,
        ];

        requestCommentRepositoryMock.findAllPagination.mockResolvedValueOnce(
          mockPaginatedResult,
        );
        const result = await service.findAllPagination(0, 10, 'request-1');

        expect(
          requestCommentRepositoryMock.findAllPagination,
        ).toHaveBeenCalledWith(0, 10, {
          order: { createdAt: 'DESC' },
          where: { requestId: 'request-1' },
          relations: { member: true, role: true },
        });
        expect(result).toEqual(mockPaginatedResult);
      });
    });
  });
});
