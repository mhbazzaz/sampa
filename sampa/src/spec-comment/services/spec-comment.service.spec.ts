import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
import { Role } from 'src/role/entities/role.entity';
import { RequestSpecContentRepositoryMock } from 'src/spec/__mocks__/request-spec-content.repository';
import { RequestSpecContent } from 'src/spec/entities/request-spec-content.entity';
import { RequestSpecContentRepository } from 'src/spec/repositories/request-spec-content.repository';
import { SpecComment } from '../entities/spec-comment.entity';
import { SpecCommentRepository } from '../repositories/spec-comment.repository';
import { SpecCommentService } from './spec-comment.service';

describe('SpecCommentService', () => {
  let service: SpecCommentService;
  let specCommentRepositoryMock: jest.Mocked<SpecCommentRepository>;
  let memberRepositoryMock: jest.Mocked<MemberRepository>;
  let i18nServiceMock: jest.Mocked<I18nService>;

  const mockRole = { id: 'role-1', name: 'user' } as Role;

  const mockMember = {
    id: 'member-1',
    roles: [mockRole],
  } as Member;

  const mockSpecComment = {
    id: 'spec-comment-1',
    memberId: 'member-1',
    specId: 'spec-1',
    roleId: 'role-1',
    comment: 'Test spec comment',
    createdAt: new Date(),
    updatedAt: new Date(),
    member: mockMember,
    role: mockRole,
    spec: {} as RequestSpecContent,
  } as SpecComment;

  beforeEach(async () => {
    specCommentRepositoryMock = {
      save: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      findAndDelete: jest.fn(),
      findAllPagination: jest.fn(),
    } as unknown as jest.Mocked<SpecCommentRepository>;

    memberRepositoryMock = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    i18nServiceMock = {
      t: jest.fn().mockImplementation((key) => `translated:${key}`),
    } as unknown as jest.Mocked<I18nService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecCommentService,
        {
          provide: SpecCommentRepository,
          useValue: specCommentRepositoryMock,
        },
        {
          provide: RequestSpecContentRepository,
          useValue: RequestSpecContentRepositoryMock,
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

    service = module.get<SpecCommentService>(SpecCommentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // describe('create', () => {
  //   it('should create a new spec comment', async () => {
  //     const createDto = {
  //       specId: 'spec-1',
  //       comment: 'New spec comment',
  //     };

  //     const mockFetchedMember = {
  //       id: 'member-1',
  //       roles: [{ id: 'role-1', name: 'user' }],
  //     };

  //     memberRepositoryMock.findOne.mockResolvedValueOnce(
  //       mockFetchedMember as Member,
  //     );
  //     specCommentRepositoryMock.save.mockResolvedValueOnce(mockSpecComment);

  //     const result = await service.create(createDto, {
  //       id: 'member-1',
  //     } as Member);

  //     expect(memberRepositoryMock.findOne).toHaveBeenCalledWith({
  //       where: { id: 'member-1' },
  //       relations: { roles: true },
  //     });

  //     expect(result).toEqual(mockSpecComment);
  //   });
  // });

  describe('findOne', () => {
    it('should find one spec comment', async () => {
      const options = { where: { id: 'spec-comment-1' } };
      specCommentRepositoryMock.findOne.mockResolvedValueOnce(mockSpecComment);

      const result = await service.findOne(options);

      expect(specCommentRepositoryMock.findOne).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockSpecComment);
    });
  });

  describe('findAll', () => {
    it('should return all spec comments', async () => {
      const mockComments = [mockSpecComment];
      specCommentRepositoryMock.findAll.mockResolvedValueOnce(mockComments);

      const result = await service.findAll();

      expect(specCommentRepositoryMock.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockComments);
    });
  });

  describe('update', () => {
    it('should update a spec comment', async () => {
      const where = { id: 'spec-comment-1' };
      const updateData = { comment: 'Updated comment' };

      await service.update(where, updateData);

      expect(specCommentRepositoryMock.update).toHaveBeenCalledWith(
        where,
        updateData,
      );
    });
  });

  describe('remove', () => {
    it('should delete a spec comment', async () => {
      const where = { id: 'spec-comment-1' };

      await service.remove(where);

      expect(specCommentRepositoryMock.findAndDelete).toHaveBeenCalledWith(
        where,
      );
    });
  });

  describe('findAllPagination', () => {
    it('should return paginated spec comments with relations', async () => {
      const mockPaginatedResult: [SpecComment[], number] = [
        [mockSpecComment],
        1,
      ];
      specCommentRepositoryMock.findAllPagination.mockResolvedValueOnce(
        mockPaginatedResult,
      );

      const result = await service.findAllPagination(0, 10, 'spec-1');

      expect(specCommentRepositoryMock.findAllPagination).toHaveBeenCalledWith(
        0,
        10,
        {
          order: { createdAt: 'DESC' },
          where: { specId: 'spec-1' },
          relations: { member: true, role: true },
        },
      );
      expect(result).toEqual(mockPaginatedResult);
    });
  });
});
