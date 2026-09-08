import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { ActionLogBufferServiceMock } from 'src/action-log/__mock__/action-log-buffer.service';
import { ActionLogRepositoryMock } from 'src/action-log/__mock__/action-log.repository';
import { ActionLogRepository } from 'src/action-log/repositories/action-log.repository';
import { ActionLogBufferService } from 'src/action-log/services/action-log-buffer.service';
import { ActionRepositoryMock } from 'src/action/__mocks__/action.repository';
import { ActionRepository } from 'src/action/repositories/action.repository';
import { AssessmentLayerRepositoryMock } from 'src/assessment/__mocks__/assessment-layer.repository';
import { AssessmentRequestRepositoryMock } from 'src/assessment/__mocks__/assessment-request.repository';
import { StateTransitionServiceMock } from 'src/assessment/__mocks__/state-transition.service';
import { AssessmentLayerRepository } from 'src/assessment/repositories/assessment-layer.repository';
import { AssessmentRequestRepository } from 'src/assessment/repositories/assessment-request.repository';
import { AssetServiceMock } from 'src/asset/__mocks__/asset-to-audit.service';
import { AssetService } from 'src/asset/services/asset-to-audit.service';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { GroupMembershipRepositoryMock } from 'src/group-membership/__mocks__/group-membership.repository';
import { GroupMembershipRepository } from 'src/group-membership/repositories/group-membership.repository';
import { MemberServiceMock } from 'src/member/__mocks__/member.service';
import { MemberService } from 'src/member/services/member.service';
import { ProcessRepositoryMock } from 'src/process/__mocks__/process.repository';
import { ProcessRepository } from 'src/process/repositories/process.repository';
import { StateTransitionService } from 'src/state-transition/services/state-transition.service';
import { RequestSpecContentRepositoryMock } from '../__mocks__/request-spec-content.repository';
import { RequestSpecItemRepositoryMock } from '../__mocks__/request-spec-item.repository';
import { RequestSpecItemServiceMock } from '../__mocks__/request-spec-item.service';
import { RequestSpecContent } from '../entities/request-spec-content.entity';
import { RequestSpecContentRepository } from '../repositories/request-spec-content.repository';
import { RequestSpecItemRepository } from '../repositories/request-spec-item.repository';
import { RequestSpecContentService } from './request-spec-content.service';
import { RequestSpecItemService } from './request-spec-item.service';

describe('RequestSpecContentService', () => {
  let service: RequestSpecContentService;
  let repository: typeof RequestSpecContentRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        RequestSpecContentService,
        {
          provide: RequestSpecContentRepository,
          useValue: RequestSpecContentRepositoryMock,
        },
        {
          provide: ActionLogRepository,
          useValue: ActionLogRepositoryMock,
        },
        {
          provide: RequestSpecItemService,
          useValue: RequestSpecItemServiceMock,
        },
        {
          provide: MemberService,
          useValue: MemberServiceMock,
        },
        {
          provide: GroupMembershipRepository,
          useValue: GroupMembershipRepositoryMock,
        },
        {
          provide: AssessmentRequestRepository,
          useValue: AssessmentRequestRepositoryMock,
        },
        {
          provide: RequestSpecItemRepository,
          useValue: RequestSpecItemRepositoryMock,
        },
        {
          provide: ProcessRepository,
          useValue: ProcessRepositoryMock,
        },
        {
          provide: StateTransitionService,
          useValue: StateTransitionServiceMock,
        },
        {
          provide: AssessmentLayerRepository,
          useValue: AssessmentLayerRepositoryMock,
        },
        {
          provide: ActionRepository,
          useValue: ActionRepositoryMock,
        },
        {
          provide: AssetService,
          useValue: AssetServiceMock,
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

    service = module.get<RequestSpecContentService>(RequestSpecContentService);
    repository = module.get(RequestSpecContentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should find one requestContentItem', async () => {
      const requestContentItem = {
        id: '1',
        value: '{}',
      } as RequestSpecContent;

      repository.findOne.mockResolvedValue(requestContentItem);
      const result = await service.findOne({ where: { id: '1' } });

      expect(result).toEqual(requestContentItem);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('findAll', () => {
    it('should find all requestContentItems', async () => {
      const requestContentItems = [
        {
          id: '1',
          value: '{}',
        },
        {
          id: '2',
          value: '{}',
        },
      ] as RequestSpecContent[];

      repository.findAll.mockResolvedValue(requestContentItems);
      const result = await service.findAll();

      expect(result).toEqual(requestContentItems);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a requestContentItem', async () => {
      repository.findAndDelete.mockResolvedValue(null);

      await service.remove({ id: '1' });
      expect(repository.findAndDelete).toHaveBeenCalledWith({
        id: '1',
      });
    });
  });

  describe('findAllPagination', () => {
    it('should find all requestContentItems with pagination', async () => {
      const requestContentItems: RequestSpecContent[] = [
        {
          id: '1',
          value: '{}',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          _v: 1,
          assessmentRequestId: '',
          requestSpecItemId: '',
        },
        {
          id: '2',
          value: '{}',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          _v: 1,
          assessmentRequestId: '',
          requestSpecItemId: '',
        },
      ];

      repository.findAllPagination.mockResolvedValue([requestContentItems, 2]);

      const result = await service.findAllPagination(0, 10);

      expect(result).toEqual([requestContentItems, 2]);
      expect(repository.findAllPagination).toHaveBeenCalledWith(0, 10, {
        order: { createdAt: 'DESC' },
      });
    });
  });
});
