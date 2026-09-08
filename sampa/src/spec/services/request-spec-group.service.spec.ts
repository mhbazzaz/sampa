import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { AssetServiceMock } from 'src/asset/__mocks__/asset-to-audit.service';
import { AssetService } from 'src/asset/services/asset-to-audit.service';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { GroupServiceMock } from 'src/group/__mocks__/group.service';
import { GroupService } from 'src/group/services/group.service';
import { MemberServiceMock } from 'src/member/__mocks__/member.service';
import { MemberService } from 'src/member/services/member.service';
import { RequestSpecGroupRepositoryMock } from '../__mocks__/request-spec-group.repository';
import { RequestSpecGroup } from '../entities/request-spec-group.entity';
import { RequestSpecGroupRepository } from '../repositories/request-spec-group.repository';
import { RequestSpecGroupService } from './request-spec-group.service';

describe('RequestSpecGroupService', () => {
  let service: RequestSpecGroupService;
  let repository: typeof RequestSpecGroupRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        RequestSpecGroupService,
        {
          provide: RequestSpecGroupRepository,
          useValue: RequestSpecGroupRepositoryMock,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn(),
          },
        },
        {
          provide: GroupService,
          useValue: GroupServiceMock,
        },
        {
          provide: MemberService,
          useValue: MemberServiceMock,
        },
        {
          provide: AssetService,
          useValue: AssetServiceMock,
        },
      ],
    }).compile();

    service = module.get<RequestSpecGroupService>(RequestSpecGroupService);
    repository = module.get(RequestSpecGroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should find one requestSpecItem', async () => {
      const requestSpecItem: RequestSpecGroup = {
        id: '1',
        name: 'string',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        _v: 1,
      };

      repository.findOne.mockResolvedValue(requestSpecItem);
      const result = await service.findOne({ where: { id: '1' } });

      expect(result).toEqual(requestSpecItem);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('findAll', () => {
    it('should find all requestSpecItems', async () => {
      const requestSpecItems: RequestSpecGroup[] = [
        {
          id: '1',
          name: 'string',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          _v: 1,
        },
        {
          id: '2',
          name: 'string',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          _v: 1,
        },
      ];

      repository.findAll.mockResolvedValue(requestSpecItems);
      const result = await service.findAll();

      expect(result).toEqual(requestSpecItems);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a requestSpecItem', async () => {
      repository.findAndDelete.mockResolvedValue(null);

      await service.remove({ id: '1' });
      expect(repository.findAndDelete).toHaveBeenCalledWith({
        id: '1',
      });
    });
  });

  describe('findAllPagination', () => {
    it('should find all requestSpecItems with pagination', async () => {
      const requestSpecItems: RequestSpecGroup[] = [
        {
          id: '1',
          name: 'string',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          _v: 1,
        },
        {
          id: '2',
          name: 'string',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          _v: 1,
        },
      ];

      repository.findAllPagination.mockResolvedValue([requestSpecItems, 2]);

      const result = await service.findAllPagination(0, 10);

      expect(result).toEqual([requestSpecItems, 2]);
      expect(repository.findAllPagination).toHaveBeenCalledWith(0, 10, {
        order: { createdAt: 'DESC' },
      });
    });
  });
});
