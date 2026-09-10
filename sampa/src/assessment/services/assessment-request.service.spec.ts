import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { ActionLogBufferServiceMock } from 'src/action-log/__mock__/action-log-buffer.service';
import { ChangelogConfigFactoryMock } from 'src/action-log/__mock__/changelog-config-factory';
import { GenericChangelogServiceMock } from 'src/action-log/__mock__/generic-changelog.service';
import { ActionLogRepository } from 'src/action-log/repositories/action-log.repository';
import { ActionLogBufferService } from 'src/action-log/services/action-log-buffer.service';
import { ChangelogConfigFactory } from 'src/action-log/services/change-log-configs';
import { GenericChangelogService } from 'src/action-log/services/generic-change-log.service';
import { Action } from 'src/action/entities/action.entity';
import { ActionRepository } from 'src/action/repositories/action.repository';
import { AssetService } from 'src/asset/services/asset-to-audit.service';
import { ActionEnum } from 'src/common/enums/action.enum';
import { ProcessEnum } from 'src/common/enums/process.enum';
import { EnvironmentRepository } from 'src/environment/repositories/environment.repository';
import { EnvironmentService } from 'src/environment/services/environment.service';
import { GroupMembershipRepository } from 'src/group-membership/repositories/group-membership.repository';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
import { Process } from 'src/process/entities/process.entity';
import { ProcessRepository } from 'src/process/repositories/process.repository';
import { RequestCommentRepository } from 'src/request-comment/repositories/request-comment.repository';
import { RequestSpecItemRepository } from 'src/spec/repositories/request-spec-item.repository';
import { StateTransitionRepository } from 'src/state-transition/repositories/state-transition.repository';
import { StateTransitionService } from 'src/state-transition/services/state-transition.service';
import { State } from 'src/states/entities/state.entity';
import { StatesRepository } from 'src/states/repositories/state.repository';
import { StatesService } from 'src/states/services/states.service';
import { DataSource } from 'typeorm';
import { UpdateRequestStatusByActionDto } from '../dto/input/update-request-status-by-action.dto';
import { AssessmentLayer } from '../entities/assessment-layer.entity';
import { AssessmentRequest } from '../entities/assessment-request.entity';
import { AssessmentLayerRepository } from '../repositories/assessment-layer.repository';
import { AssessmentRequestRepository } from '../repositories/assessment-request.repository';
import { AssessmentTeamRepository } from '../repositories/assessment-team.repository';
import { AssessmentTypeRepository } from '../repositories/assessment-type.repository';
import { AssessmentLayerService } from './assessment-layer.service';
import { AssessmentRequestService } from './assessment-request.service';

describe('AssessmentRequestService', () => {
  let service: AssessmentRequestService;
  let assessmentRequestRepository: AssessmentRequestRepository;
  let assessmentLayerRepository: AssessmentLayerRepository;
  let actionRepository: ActionRepository;
  let stateTransitionRepository: StateTransitionRepository;
  let processRepository: ProcessRepository;
  let memberRepository: MemberRepository;
  let environmentService: EnvironmentService;
  let requestSpecItemRepository: RequestSpecItemRepository;
  let statesRepository: StatesRepository;
  let groupMembershipRepository: GroupMembershipRepository;
  let assetService: AssetService;
  let assessmentTypeRepository: AssessmentTypeRepository;
  let assessmentTeamRepository: AssessmentTeamRepository;
  let stateTransitionService: StateTransitionService;
  let stateService: StatesService;
  let i18nService: I18nService;
  let actionLogBufferService: ActionLogBufferService;
  let genericChangelogService: GenericChangelogService;
  let changelogConfigFactory: ChangelogConfigFactory;

  const mockDataSource = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentRequestService,
        {
          provide: AssessmentRequestRepository,
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            findAndDelete: jest.fn(),
            findAllPagination: jest.fn(),
            createAssessmentRequest: jest.fn(),
            createAssessmentLayer: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ActionLogRepository,
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: EnvironmentRepository,
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            findAndDelete: jest.fn(),
            findAllPagination: jest.fn(),
            createAssessmentRequest: jest.fn(),
            createAssessmentLayer: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: RequestCommentRepository,
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            findAndDelete: jest.fn(),
            findAllPagination: jest.fn(),
            createAssessmentRequest: jest.fn(),
            createAssessmentLayer: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: AssessmentTeamRepository,
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            findAndDelete: jest.fn(),
            findAllPagination: jest.fn(),
            createAssessmentRequest: jest.fn(),
            createAssessmentLayer: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: EnvironmentService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AssetService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: StatesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: StateTransitionService,
          useValue: {
            findOne: jest.fn(),
            getNextStatus: jest.fn(),
          },
        },
        {
          provide: AssessmentTypeRepository,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: StatesRepository,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: RequestSpecItemRepository,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: MemberRepository,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: GroupMembershipRepository,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: ProcessRepository,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: StateTransitionRepository,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: ActionRepository,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: AssessmentLayerService,
          useValue: {},
        },
        {
          provide: AssessmentLayerRepository,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            updateManyStateByAssessmentRequestId: jest.fn(),
          },
        },
        {
          provide: ActionLogBufferService,
          useValue: ActionLogBufferServiceMock,
        },
        {
          provide: GenericChangelogService,
          useValue: GenericChangelogServiceMock,
        },
        {
          provide: ChangelogConfigFactory,
          useValue: ChangelogConfigFactoryMock,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockReturnValue('Mocked Translation'),
          },
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<AssessmentRequestService>(AssessmentRequestService);
    assessmentRequestRepository = module.get<AssessmentRequestRepository>(
      AssessmentRequestRepository,
    );
    assessmentLayerRepository = module.get<AssessmentLayerRepository>(
      AssessmentLayerRepository,
    );
    groupMembershipRepository = module.get<GroupMembershipRepository>(
      GroupMembershipRepository,
    );
    requestSpecItemRepository = module.get<RequestSpecItemRepository>(
      RequestSpecItemRepository,
    );
    memberRepository = module.get<MemberRepository>(MemberRepository);
    processRepository = module.get<ProcessRepository>(ProcessRepository);
    actionRepository = module.get<ActionRepository>(ActionRepository);
    stateTransitionRepository = module.get<StateTransitionRepository>(
      StateTransitionRepository,
    );
    statesRepository = module.get<StatesRepository>(StatesRepository);
    stateTransitionService = module.get<StateTransitionService>(
      StateTransitionService,
    );

    environmentService = module.get<EnvironmentService>(EnvironmentService);
    assetService = module.get<AssetService>(AssetService);
    assessmentTypeRepository = module.get<AssessmentTypeRepository>(
      AssessmentTypeRepository,
    );
    i18nService = module.get<I18nService>(I18nService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call save method of repository and return created AssessmentRequest', async () => {
      const assessmentRequestData = {
        id: '1',
        name: 'Test Request',
      };

      jest
        .spyOn(assessmentRequestRepository, 'save')
        .mockResolvedValue(assessmentRequestData as any);

      const result = await service.create(assessmentRequestData);

      expect(assessmentRequestRepository.save).toHaveBeenCalledWith(
        assessmentRequestData,
      );
      expect(result).toEqual(assessmentRequestData);
    });
  });

  describe('findOne', () => {
    it('should call findOne and return the found assessment request', async () => {
      const assessmentRequestData = {
        id: '1',
        name: 'Test Request',
      };

      jest
        .spyOn(assessmentRequestRepository, 'findOne')
        .mockResolvedValue(assessmentRequestData as any);

      const result = await service.findOne({ where: { id: '1' } });

      expect(assessmentRequestRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(assessmentRequestData);
    });

    it('should throw an error if no assessment request is found', async () => {
      jest
        .spyOn(assessmentRequestRepository, 'findOne')
        .mockResolvedValue(null);

      try {
        await service.findOne({ where: { id: 'non-existent-id' } });
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toEqual('Mocked Translation');
      }
    });
  });

  describe('createAssessmentRequest', () => {
    it('should throw BadRequestException when environment is not found', async () => {
      const dto = {
        assetReferenceId: '1',
        environmentId: '1',
        assessmentTypeIds: ['1'],
        assetToAuditBaseline: 'test',
        type: 'someType',
        info: 'test',
      };
      const memberId = 'member-1';

      jest.spyOn(environmentService, 'findOne').mockResolvedValue(null);

      try {
        await service.createAssessmentRequest(dto, { id: memberId } as any, []);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toEqual('Mocked Translation');
      }
    });
  });

  describe('updateAssessmentRequestStatusByAction', () => {
    it('should throw if request is not found', async () => {
      jest
        .spyOn(assessmentRequestRepository, 'findOne')
        .mockResolvedValue(null);

      const member = {
        id: '1',
      } as Member;

      await expect(
        service.updateAssessmentRequestStatusByAction(
          '1',
          {
            action: ActionEnum.ApprovedAccept,
          },
          member,
          [],
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update assessment request state successfully (generic action)', async () => {
      const mockRequest = { id: 'req1', stateId: 'stateA' };
      const mockProcess = { id: 'proc1', name: ProcessEnum.AssessmentRequest };
      const mockAction = { id: 'action1', name: ActionEnum.ApprovedAccept };
      const mockNextState = { id: 'stateB' };
      const mockLayers = [{ id: 'layer1', stateId: 'layerStateA' }];

      jest
        .spyOn(assessmentRequestRepository, 'findOne')
        .mockResolvedValue(mockRequest as AssessmentRequest);

      jest
        .spyOn(processRepository, 'findOne')
        .mockResolvedValue(mockProcess as Process);

      jest
        .spyOn(actionRepository, 'findOne')
        .mockResolvedValue(mockAction as Action);

      jest
        .spyOn(stateTransitionService, 'getNextStatus')
        .mockResolvedValue(mockNextState as State);

      jest
        .spyOn(assessmentRequestRepository, 'update')
        .mockResolvedValue({} as AssessmentRequest);

      jest
        .spyOn(assessmentLayerRepository, 'find')
        .mockResolvedValue(mockLayers as AssessmentLayer[]);

      const member = {
        id: '1',
      } as Member;

      const result = await service.updateAssessmentRequestStatusByAction(
        '1',
        {
          action: ActionEnum.ApprovedAccept,
        } as UpdateRequestStatusByActionDto,
        member,
        [],
      );

      expect(result).toBe(true);
      expect(assessmentRequestRepository.update).toHaveBeenCalledWith(
        { id: '1' },
        { stateId: 'stateB' },
      );
    });

    it('should handle ApprovedAccept action and update assessment layer states', async () => {
      const mockRequest = { id: 'req1', stateId: 'stateA' };
      const mockProcessMain = {
        id: 'procMain',
        name: ProcessEnum.AssessmentRequest,
      };
      const mockProcessLayer = {
        id: 'procLayer',
        name: ProcessEnum.AssessmentLayer,
      };
      const mockActionMain = {
        id: 'actionMain',
        name: ActionEnum.ApprovedAccept,
      };
      const mockActionLayer = {
        id: 'actionLayer',
        name: ActionEnum.InitiatedRegister,
      };
      const mockNextStateMain = { id: 'nextStateMain' };
      const mockNextStateLayer = { id: 'nextStateLayer' };
      const mockLayers = [{ id: 'layer1', stateId: 'layerStateA' }];

      jest
        .spyOn(assessmentRequestRepository, 'findOne')
        .mockResolvedValue(mockRequest as AssessmentRequest);

      jest
        .spyOn(processRepository, 'findOne')
        .mockResolvedValueOnce(mockProcessMain as Process)
        .mockResolvedValueOnce(mockProcessLayer as Process);

      jest
        .spyOn(actionRepository, 'findOne')
        .mockResolvedValueOnce(mockActionMain as Action)
        .mockResolvedValueOnce(mockActionLayer as Action);

      jest
        .spyOn(stateTransitionService, 'getNextStatus')
        .mockResolvedValueOnce(mockNextStateMain as State)
        .mockResolvedValueOnce(mockNextStateLayer as State);

      jest
        .spyOn(assessmentLayerRepository, 'find')
        .mockResolvedValue(mockLayers as AssessmentLayer[]);

      jest
        .spyOn(assessmentRequestRepository, 'update')
        .mockResolvedValue({} as AssessmentRequest);

      jest
        .spyOn(
          assessmentLayerRepository,
          'updateManyStateByAssessmentRequestId',
        )
        .mockResolvedValue();

      const member = {
        id: '1',
      } as Member;

      const result = await service.updateAssessmentRequestStatusByAction(
        'req1',
        {
          action: ActionEnum.ApprovedAccept,
        } as UpdateRequestStatusByActionDto,
        member,
        [],
      );

      expect(result).toBe(true);
      expect(assessmentRequestRepository.update).toHaveBeenCalledWith(
        { id: 'req1' },
        { stateId: 'nextStateMain' },
      );
      expect(
        assessmentLayerRepository.updateManyStateByAssessmentRequestId,
      ).toHaveBeenCalledWith('req1', { stateId: 'nextStateLayer' });
    });
  });
});
