import { Test, TestingModule } from '@nestjs/testing';
import { MemberRepositoryMock } from '../__mocks__/member.repository';
import { Member } from '../entities/member.entity';
import { MemberRepository } from '../repositories/member.repository';
import { MemberService } from './member.service';

describe('MemberService', () => {
  let service: MemberService;
  let repository: typeof MemberRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        {
          provide: MemberRepository,
          useValue: MemberRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
    repository = module.get(MemberRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an member', async () => {
      const Member = {
        id: '1',
      } as Member;

      repository.save.mockResolvedValue(Member);
      const result = await service.create(Member);

      expect(result).toEqual(Member);
      expect(repository.save).toHaveBeenCalledWith(Member);
    });
  });

  describe('findOne', () => {
    it('should find one member', async () => {
      const Member = {
        id: '1',
      } as Member;

      repository.findOne.mockResolvedValue(Member);
      const result = await service.findOne({
        where: { id: '1' },
      });

      expect(result).toEqual(Member);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('findAll', () => {
    it('should find all member', async () => {
      const Members = [
        {
          id: '1',
        },
      ] as Member[];

      repository.findAll.mockResolvedValue(Members);
      const result = await service.findAll();

      expect(result).toEqual(Members);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an member', async () => {
      const updateData = { userId: '9867' } as Partial<Member>;

      repository.update.mockResolvedValue(null);
      await service.update({ id: '1' }, updateData);

      expect(repository.update).toHaveBeenCalledWith({ id: '1' }, updateData);
    });
  });

  describe('remove', () => {
    it('should remove an member', async () => {
      repository.findAndDelete.mockResolvedValue(null);

      await service.remove({ id: '1' });
      expect(repository.findAndDelete).toHaveBeenCalledWith({
        id: '1',
      });
    });
  });

  describe('findAllPagination', () => {
    it('should find all member with pagination', async () => {
      const Members = [
        {
          id: '1',
        },
      ] as Member[];

      repository.findAllPagination.mockResolvedValue([Members, 2]);
      const result = await service.findAllPagination({ skip: 0, take: 10 });

      expect(result).toEqual([Members, 2]);
      expect(repository.findAllPagination).toHaveBeenCalled();
    });
  });
});
