import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { ActionLogBufferServiceMock } from 'src/action-log/__mock__/action-log-buffer.service';
import { ActionLogRepository } from 'src/action-log/repositories/action-log.repository';
import { ActionLogBufferService } from 'src/action-log/services/action-log-buffer.service';
import { ActionRepository } from 'src/action/repositories/action.repository';
import { userMapperLevel1Mock } from 'src/common/helpers/__mocks__/user-mapper-level-1';
import { userMapperLevel1 } from 'src/common/helpers/user-mapper-level-1';
import { GroupMembershipRepository } from 'src/group-membership/repositories/group-membership.repository';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
import { ProcessRepository } from 'src/process/repositories/process.repository';
import { RequestSpecItemRepository } from 'src/spec/repositories/request-spec-item.repository';
import { StateTransitionRepository } from 'src/state-transition/repositories/state-transition.repository';
import { StateTransitionService } from 'src/state-transition/services/state-transition.service';
import { StatesRepository } from 'src/states/repositories/state.repository';
import { DataSource, QueryRunner } from 'typeorm';
import { UpdateAssessmentLayerAuditorsDto } from '../dto/input/update-assessment-layer-add-auditors.dto';
import { AssessmentLayerRepository } from '../repositories/assessment-layer.repository';
import { AssessmentRequestRepository } from '../repositories/assessment-request.repository';
import { AssessmentTeamRepository } from '../repositories/assessment-team.repository';
import { AssessmentLayerService } from './assessment-layer.service';

jest.mock('../../vault/vault', () => ({
  Vault: {
    instance: {
      get: jest.fn().mockResolvedValue('mocked-value'),
    },
  },
}));

describe('AssessmentLayerService', () => {
  let service: AssessmentLayerService;
  let assessmentLayerRepository: jest.Mocked<AssessmentLayerRepository>;
  let requestSpecItemRepository: jest.Mocked<RequestSpecItemRepository>;
  let assessmentTeamRepository: jest.Mocked<AssessmentTeamRepository>;
  let assessmentRequestRepository: jest.Mocked<AssessmentRequestRepository>;
  let statesRepository: jest.Mocked<StatesRepository>;
  let stateTransitionRepository: jest.Mocked<StateTransitionRepository>;
  let stateTransitionService: jest.Mocked<StateTransitionService>;
  let processRepository: jest.Mocked<ProcessRepository>;
  let i18nService: jest.Mocked<I18nService>;
  let actionRepository: jest.Mocked<ActionRepository>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        update: jest.fn().mockResolvedValue(undefined),
        find: jest.fn().mockResolvedValue(undefined),
        findOne: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as jest.Mocked<QueryRunner>;

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentLayerService,
        {
          provide: AssessmentLayerRepository,
          useValue: {
            addSupervisor: jest.fn(),
            addAuditors: jest.fn(),
            findAllPagination: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: RequestSpecItemRepository,
          useValue: {
            addSupervisor: jest.fn(),
            addAuditors: jest.fn(),
            findAllPagination: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
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
          provide: MemberRepository,
          useValue: {
            findAllPagination: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: AssessmentTeamRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: AssessmentRequestRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: StateTransitionRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: StateTransitionService,
          useValue: {
            getNextStatus: jest.fn(),
            getAllNextStatus: jest.fn(),
          },
        },
        {
          provide: GroupMembershipRepository,
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: ProcessRepository,
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: StatesRepository,
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key) => `translated:${key}`),
          },
        },
        {
          provide: ActionRepository,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => ({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              manager: {
                update: jest.fn(),
              },
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
            })),
          },
        },
        {
          provide: userMapperLevel1,
          useValue: userMapperLevel1Mock,
        },
        {
          provide: ActionLogBufferService,
          useValue: ActionLogBufferServiceMock,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<AssessmentLayerService>(AssessmentLayerService);
    assessmentLayerRepository = module.get(AssessmentLayerRepository);
    assessmentTeamRepository = module.get(AssessmentTeamRepository);
    assessmentRequestRepository = module.get(AssessmentRequestRepository);
    stateTransitionRepository = module.get(StateTransitionRepository);
    stateTransitionService = module.get(StateTransitionService);
    processRepository = module.get(ProcessRepository);
    i18nService = module.get(I18nService);
    actionRepository = module.get(ActionRepository);
    statesRepository = module.get(StatesRepository);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addSupervisor', () => {
    it('should call repository method', async () => {
      const mockData = {
        dataList: [
          {
            supervisorIds: ['supervisor1', 'supervisor2'],
            action: 'supervised_assignSupervisor',
          },
        ],
      };
      assessmentLayerRepository.addSupervisor.mockResolvedValue(true);
      const memberId = 'member-1';

      const result = await service.addSupervisor(
        mockData,
        { id: memberId } as Member,
        [],
      );

      expect(assessmentLayerRepository.addSupervisor).toHaveBeenCalledWith(
        mockData,
        { id: memberId } as Member,
        [],
      );
      expect(result).toBe(true);
    });
  });

  describe('addAuditors', () => {
    it('should call repository method with correct parameters', async () => {
      const mockData: UpdateAssessmentLayerAuditorsDto = {
        dataList: [{ auditorIds: ['auditor1', 'auditor2'] }],
      };
      const mockMember = { id: 'member-id' } as any;
      const mockRoles = [{ id: 'role1' }, { id: 'role2' }] as any;
      assessmentLayerRepository.addAuditors.mockResolvedValue(true);

      const result = await service.addAuditors(mockData, mockMember, mockRoles);

      expect(assessmentLayerRepository.addAuditors).toHaveBeenCalledWith(
        mockData,
        mockMember,
        mockRoles,
      );
      expect(result).toBe(true);
    });
  });

  describe('cartable', () => {
    // it('should return cartable data for member', async () => {
    //   const mockSkip = 0;
    //   const mockTake = 10;
    //   const mockMemberRoles = [{ name: 'role1' }, { name: 'role2' }];
    //   const mockMemberId = 'member-id';
    //   const mockActions = [
    //     {
    //       id: 'action1',
    //       name: 'Action 1',
    //       tier: ActionTierEnum.BACKEND,
    //       processId: 'Process 1',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //       deletedAt: null,
    //       _v: 0,
    //     },
    //     {
    //       id: 'action2',
    //       name: 'Action 2',
    //       tier: ActionTierEnum.BACKEND,
    //       processId: 'Process 2',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //       deletedAt: null,
    //       _v: 0,
    //     },
    //   ];
    //   const mockStateTransitions = [
    //     {
    //       id: 'state-transition1',
    //       currentStateId: 'state1',
    //       processId: 'processId1',
    //       actionId: 'action1',
    //       nextStateId: 'nextState1',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //       deletedAt: null,
    //       _v: 0,
    //     },
    //     {
    //       id: 'state-transition2',
    //       currentStateId: 'state2',
    //       processId: 'processId2',
    //       actionId: 'action2',
    //       nextStateId: 'nextState2',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //       deletedAt: null,
    //       _v: 0,
    //     },
    //   ];
    //   const mockResult = [
    //     {
    //       id: 'layer1',
    //       stateId: 'state1',
    //       assessmentRequestId: 'request1',
    //       assessmentTypeId: 'type1',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //       deletedAt: null,
    //       _v: 0,
    //     },
    //     {
    //       id: 'layer2',
    //       stateId: 'state2',
    //       assessmentRequestId: 'request2',
    //       assessmentTypeId: 'type2',
    //       createdAt: new Date(),
    //       updatedAt: new Date(),
    //       deletedAt: null,
    //       _v: 0,
    //     },
    //   ];
    //   const mockTotal = 2;
    //   actionRepository.findAll.mockResolvedValue(mockActions);
    //   stateTransitionRepository.findAll.mockResolvedValue(mockStateTransitions);
    //   assessmentLayerRepository.findAllPagination.mockResolvedValue([
    //     mockResult,
    //     mockTotal,
    //   ]);
    //   const result = await service.cartable(
    //     mockSkip,
    //     mockTake,
    //     mockMemberRoles as any,
    //     mockMemberId,
    //   );
    //   expect(actionRepository.findAll).toHaveBeenCalledWith({
    //     select: { id: true, name: true },
    //     relations: { roles: true },
    //     where: {
    //       roles: { id: In(mockMemberRoles.map((role: any) => role.id)) },
    //     },
    //   });
    //   expect(stateTransitionRepository.findAll).toHaveBeenCalledWith({
    //     where: { actionId: In(['action1', 'action2']) },
    //     select: { currentStateId: true },
    //   });
    //   expect(assessmentLayerRepository.findAllPagination).toHaveBeenCalledWith(
    //     mockSkip,
    //     mockTake,
    //     {
    //       order: { createdAt: 'DESC' },
    //       where: {
    //         stateId: In(['state1', 'state2']),
    //         assessmentTeams: { memberId: mockMemberId },
    //         assessmentType: { name: In(['role1', 'role2']) },
    //       },
    //       relations: {
    //         state: true,
    //         assessmentType: true,
    //         assessmentTeams: true,
    //         assessmentRequest: { asset: true, state: true },
    //       },
    //     },
    //   );
    //   expect(result).toEqual({ result: mockResult, count: mockTotal });
    // });
  });

  // describe('updateAssessmentLayerStatusByActionMyTeam', () => {
  //   const mockLayerId = 'layer-id';
  //   const mockData = { action: ActionEnum.OnboardingAccept };
  //   const mockMemberId = 'member-id';

  //   const mockRequestLayer = {
  //     id: mockLayerId,
  //     stateId: 'current-state',
  //     assessmentRequestId: 'request-id',
  //     assessmentRequest: {
  //       id: 'request-id',
  //       stateId: 'request-state',
  //     },
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     deletedAt: null,
  //     _v: 1,
  //   };

  //   const mockProcess = {
  //     id: 'process-id',
  //     name: ProcessEnum.AssessmentLayer,
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     deletedAt: null,
  //     _v: 1,
  //   };
  //   const mockAction = {
  //     id: 'action-id',
  //     name: ActionEnum.OnboardingAccept,
  //     tier: ActionTierEnum.BACKEND,
  //     processId: 'process-id',
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     deletedAt: new Date(),
  //     _v: 1,
  //   };
  //   const mockStateTransition = {
  //     id: 'new-state-id',
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     deletedAt: new Date(),
  //     _v: 1,
  //   };

  //   beforeEach(() => {
  //     assessmentLayerRepository.findOne.mockResolvedValue(
  //       mockRequestLayer as any,
  //     );
  //     processRepository.findOne.mockResolvedValue(mockProcess as any);
  //     actionRepository.findOne.mockResolvedValue(mockAction as any);
  //     stateTransitionService.getNextStatus.mockResolvedValue(
  //       mockStateTransition as any,
  //     );
  //     stateTransitionService.getAllNextStatus.mockResolvedValue([
  //       mockStateTransition,
  //     ] as any);
  //   });

  //   // it('should successfully update assessment layer status', async () => {
  //   //   assessmentLayerRepository.findAll.mockResolvedValue([
  //   //     { id: mockLayerId, stateId: 'new-state-id' } as AssessmentLayer,
  //   //   ]);

  //   //   const result = await service.updateAssessmentLayerStatusByActionMyTeam(
  //   //     mockLayerId,
  //   //     mockData,
  //   //     mockMemberId,
  //   //   );

  //   //   const queryRunner = dataSource.createQueryRunner();

  //   //   expect(queryRunner.manager.update).toHaveBeenCalledWith(
  //   //     AssessmentLayer,
  //   //     { id: mockLayerId },
  //   //     { stateId: mockStateTransition.id },
  //   //   );

  //   //   expect(queryRunner.commitTransaction).toHaveBeenCalled();
  //   //   expect(queryRunner.release).toHaveBeenCalled();
  //   //   expect(result).toBe(true);
  //   // });

  //   it('should throw BadRequestException if request layer not found', async () => {
  //     assessmentLayerRepository.findOne.mockResolvedValue(null);

  //     await expect(
  //       service.updateAssessmentLayerStatusByActionMyTeam(
  //         mockLayerId,
  //         mockData,
  //         mockMemberId,
  //         [],
  //       ),
  //     ).rejects.toThrow(BadRequestException);

  //     expect(i18nService.t).toHaveBeenCalledWith(
  //       'messages.ERROR_NOT_FOUND_PROPERTY',
  //       {
  //         args: { property: 'layer' },
  //       },
  //     );
  //   });

  //   // it('should throw InternalServerErrorException if process not found', async () => {
  //   //   processRepository.findOne.mockResolvedValue(null);

  //   //   await expect(
  //   //     service.updateAssessmentLayerStatusByActionMyTeam(
  //   //       mockLayerId,
  //   //       mockData,
  //   //       mockMemberId,
  //   //     ),
  //   //   ).rejects.toThrow(InternalServerErrorException);
  //   // });

  //   // it('should throw BadRequestException if action not found', async () => {
  //   //   actionRepository.findOne.mockResolvedValue(null);

  //   //   await expect(
  //   //     service.updateAssessmentLayerStatusByActionMyTeam(
  //   //       mockLayerId,
  //   //       mockData,
  //   //       mockMemberId,
  //   //     ),
  //   //   ).rejects.toThrow(BadRequestException);

  //   //   expect(i18nService.t).toHaveBeenCalledWith(
  //   //     'messages.ERROR_NOT_FOUND_PROPERTY',
  //   //     {
  //   //       args: { property: 'action' },
  //   //     },
  //   //   );
  //   // });

  //   // it('should update assessment request when action is NeedModifications', async () => {
  //   //   const needModificationData = {
  //   //     action: ActionEnum.PendingLayerSpecsNeedModifications,
  //   //   };
  //   //   const mockRequestProcess = {
  //   //     id: 'request-process-id',
  //   //     name: ProcessEnum.AssessmentRequest,
  //   //     createdAt: new Date(),
  //   //     updatedAt: new Date(),
  //   //     deletedAt: null,
  //   //     _v: 0,
  //   //   };
  //   //   const mockRejectAction = {
  //   //     id: 'reject-action-id',
  //   //     name: ActionEnum.PreEvaluationReject,
  //   //     tier: ActionTierEnum.BACKEND,
  //   //     processId: mockProcess.id,
  //   //     createdAt: new Date(),
  //   //     updatedAt: new Date(),
  //   //     deletedAt: null,
  //   //     _v: 0,
  //   //   };
  //   //   const mockRequestStateTransition = {
  //   //     id: 'rejected-state-id',
  //   //     name: 'Rejected',
  //   //     processId: mockProcess.id,
  //   //     createdAt: new Date(),
  //   //     updatedAt: new Date(),
  //   //     deletedAt: null,
  //   //     _v: 0,
  //   //   };

  //   //   processRepository.findOne.mockImplementation((options: any) => {
  //   //     if (options.where.name === ProcessEnum.AssessmentLayer) {
  //   //       return Promise.resolve({
  //   //         id: 'some-id',
  //   //         name: ProcessEnum.AssessmentLayer,
  //   //         createdAt: new Date(),
  //   //         updatedAt: new Date(),
  //   //         deletedAt: null,
  //   //         _v: 1,
  //   //       });
  //   //     }
  //   //     if (options.where.name === ProcessEnum.AssessmentRequest) {
  //   //       return Promise.resolve(mockRequestProcess);
  //   //     }
  //   //     return Promise.resolve(null);
  //   //   });

  //   //   actionRepository.findOne.mockImplementation((options: any) => {
  //   //     if (
  //   //       options.where.name === ActionEnum.PendingLayerSpecsNeedModifications
  //   //     ) {
  //   //       return Promise.resolve(mockRejectAction);
  //   //     }
  //   //     if (options.where.name === ActionEnum.PreEvaluationReject) {
  //   //       return Promise.resolve(mockRejectAction);
  //   //     }
  //   //     return Promise.resolve(null);
  //   //   });

  //   // stateTransitionService.getNextStatus.mockImplementation(
  //   //   (options: any) => {
  //   //     if (options.actionId === mockAction.id) {
  //   //       return Promise.resolve({
  //   //         id: 'mock-state-id',
  //   //         name: 'In Progress',
  //   //         processId: mockProcess.id,
  //   //         createdAt: new Date(),
  //   //         updatedAt: new Date(),
  //   //         deletedAt: null,
  //   //         _v: 0,
  //   //       });
  //   //     }
  //   //     if (options.actionId === mockRejectAction.id) {
  //   //       return Promise.resolve(mockRequestStateTransition);
  //   //     }
  //   //     return Promise.resolve({
  //   //       id: 'default-state-id',
  //   //       name: 'Default State',
  //   //       processId: mockProcess.id,
  //   //       createdAt: new Date(),
  //   //       updatedAt: new Date(),
  //   //       deletedAt: null,
  //   //       _v: 0,
  //   //     });
  //   //   },
  //   // );

  //   //   await service.updateAssessmentLayerStatusByActionMyTeam(
  //   //     mockLayerId,
  //   //     needModificationData,
  //   //     mockMemberId,
  //   //   );

  //   //   const queryRunner = dataSource.createQueryRunner();
  //   //   expect(queryRunner.manager.update).toHaveBeenCalledWith(
  //   //     AssessmentRequest,
  //   //     { id: mockRequestLayer.assessmentRequestId },
  //   //     { stateId: mockRequestStateTransition.id },
  //   //   );
  //   // });

  //   // it('should update assessment request when all layers are accepted', async () => {
  //   //   const mockAllAcceptedLayers = [
  //   //     { stateId: 'new-state-id' },
  //   //     { stateId: 'new-state-id' },
  //   //   ];

  //   //   assessmentLayerRepository.findAll.mockResolvedValue(
  //   //     mockAllAcceptedLayers as any,
  //   //   );

  //   //   const mockRequestProcess = {
  //   //     id: 'request-process-id',
  //   //     name: ProcessEnum.AssessmentRequest,
  //   //     createdAt: new Date(),
  //   //     updatedAt: new Date(),
  //   //     deletedAt: null,
  //   //     _v: 1,
  //   //   };

  //   //   const mockAllSpecAcceptAction = {
  //   //     id: 'all-spec-accept-id',
  //   //     name: ActionEnum.PreEvaluationAccept,
  //   //     tier: ActionTierEnum.BACKEND,
  //   //     processId: 'request-process-id',
  //   //     createdAt: new Date(),
  //   //     updatedAt: new Date(),
  //   //     deletedAt: null,
  //   //     _v: 1,
  //   //   };

  //   //   processRepository.findOne.mockImplementation((options: any) => {
  //   //     if (options.where.name === ProcessEnum.AssessmentLayer) {
  //   //       return Promise.resolve(mockProcess);
  //   //     }
  //   //     if (options.where.name === ProcessEnum.AssessmentRequest) {
  //   //       return Promise.resolve(mockRequestProcess);
  //   //     }
  //   //     return Promise.resolve(null);
  //   //   });

  //   //   actionRepository.findOne.mockImplementation((options: any) => {
  //   //     if (options.where.name === ActionEnum.PreEvaluationAccept) {
  //   //       return Promise.resolve(mockAction);
  //   //     }
  //   //     if (options.where.name === ActionEnum.PreEvaluationAccept) {
  //   //       return Promise.resolve(mockAllSpecAcceptAction);
  //   //     }
  //   //     return Promise.resolve(null);
  //   //   });

  //   //   stateTransitionService.getNextStatus.mockImplementation(
  //   //     (options: any) => {
  //   //       if (options.actionId === mockAction.id) {
  //   //         return Promise.resolve({
  //   //           id: 'new-state-id',
  //   //           name: 'new-state',
  //   //           processId: 'process-id',
  //   //           createdAt: new Date(),
  //   //           updatedAt: new Date(),
  //   //           deletedAt: null,
  //   //           _v: 1,
  //   //         } as State);
  //   //       }
  //   //       if (options.actionId === mockAllSpecAcceptAction.id) {
  //   //         return Promise.resolve({
  //   //           id: 'all-accepted-state-id',
  //   //           name: 'all-accepted-state',
  //   //           processId: 'request-process-id',
  //   //           createdAt: new Date(),
  //   //           updatedAt: new Date(),
  //   //           deletedAt: null,
  //   //           _v: 1,
  //   //         } as State);
  //   //       }

  //   //       return Promise.resolve({
  //   //         id: 'default-state-id',
  //   //         name: 'default-state',
  //   //         processId: 'default-process-id',
  //   //         createdAt: new Date(),
  //   //         updatedAt: new Date(),
  //   //         deletedAt: null,
  //   //         _v: 1,
  //   //       } as State);
  //   //     },
  //   //   );
  //   //   const mockData = { action: ActionEnum.PreEvaluationAccept };

  //   //   await service.updateAssessmentLayerStatusByActionMyTeam(
  //   //     mockLayerId,
  //   //     mockData,
  //   //     mockMemberId,
  //   //   );

  //   //   const queryRunner =
  //   //     dataSource.createQueryRunner() as jest.Mocked<QueryRunner>;
  //   //   expect(queryRunner.manager.update).toHaveBeenCalledWith(
  //   //     AssessmentLayer,
  //   //     { id: mockLayerId },
  //   //     { stateId: mockStateTransition.id },
  //   //   );
  //   // });

  //   // describe('getOneAssessmentLayer', () => {
  //   //   const mockLayerId = 'layer-id';
  //   //   const mockMemberRoles = [{ id: 'role1' }, { id: 'role2' }] as any;
  //   //   const mockMemberId = 'member-id';

  //   //   const mockTeams = [
  //   //     { memberId: 'member-id', assessmentLayer: { id: 'layer-id' } },
  //   //     { memberId: 'member-id', assessmentLayer: { id: 'other-layer-id' } },
  //   //   ];

  //   //   const mockLayer = {
  //   //     id: mockLayerId,
  //   //     assessmentRequest: { asset: {}, requestSpecContents: [] },
  //   //     assessmentType: {},
  //   //     state: {},
  //   //     assessmentTeams: [{ member: {} }],
  //   //   };

  //   //   beforeEach(() => {
  //   //     assessmentTeamRepository.findAll.mockResolvedValue(mockTeams as any);
  //   //     assessmentLayerRepository.findOne.mockResolvedValue(mockLayer as any);
  //   //   });

  //   //   it('should throw NotFoundException if member is not in team', async () => {
  //   //     assessmentTeamRepository.findAll.mockResolvedValue([
  //   //       {
  //   //         memberId: 'other-member-id',
  //   //         assessmentLayer: { id: 'other-layer-id' },
  //   //       },
  //   //     ] as any);

  //   //     await expect(
  //   //       service.getOneAssessmentLayer(
  //   //         mockLayerId,
  //   //         mockMemberRoles,
  //   //         mockMemberId,
  //   //       ),
  //   //     ).rejects.toThrow(NotFoundException);

  //   //     expect(i18nService.t).toHaveBeenCalledWith(
  //   //       'messages.ERROR_NOT_FOUND_PROPERTY',
  //   //       {
  //   //         args: { property: 'layer' },
  //   //       },
  //   //     );
  //   //   });

  //   //   it('should throw NotFoundException if layer not found', async () => {
  //   //     assessmentLayerRepository.findOne.mockResolvedValue(null);

  //   //     await expect(
  //   //       service.getOneAssessmentLayer(
  //   //         mockLayerId,
  //   //         mockMemberRoles,
  //   //         mockMemberId,
  //   //       ),
  //   //     ).rejects.toThrow(NotFoundException);

  //   //     expect(i18nService.t).toHaveBeenCalledWith(
  //   //       'messages.ERROR_NOT_FOUND_PROPERTY',
  //   //       {
  //   //         args: { property: 'layer' },
  //   //       },
  //   //     );
  //   //   });
  //   // });

  //   describe('provideTestCases', () => {
  //     it('should throw if layer not found', async () => {
  //       assessmentLayerRepository.findOne.mockResolvedValue(null);
  //       const memberId = 'member-1';

  //       await expect(
  //         service.provideTestCases('layer-1', { id: memberId } as Member, []),
  //       ).rejects.toThrow(BadRequestException);
  //       expect(i18nService.t).toHaveBeenCalled();
  //     });

  //     it('should update layer state and commit transaction', async () => {
  //       (queryRunner.manager.find as jest.Mock).mockResolvedValue([]);
  //       (queryRunner.manager.findOne as jest.Mock).mockResolvedValue({});

  //       const fakeLayer = {
  //         id: 'layer-1',
  //         stateId: '1',
  //         iterationCount: 0,
  //         assessmentRequest: {
  //           id: 'req-1',
  //           requestNumber: 'REQ-2025-001',
  //           stateId: 'state-1',
  //           applicantId: 'member-1',
  //           applicantManagerId: 'member-1',
  //           cisoId: 'member-3',
  //           assetToAuditBaseline: 'baseline-1',
  //           environmentId: 'env-1',
  //           info: 'info',
  //           createdAt: new Date(),
  //           updatedAt: new Date(),
  //           deletedAt: null,
  //           _v: 1,
  //           finalState: RequestFinalStateEnum.Reject,
  //         },
  //         assessmentRequestId: 'request-id',
  //         assessmentTypeId: 'type-id',
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         deletedAt: null,
  //         _v: 1,
  //         criticalVulnerabilitiesCount: 0,
  //         highVulnerabilitiesCount: 0,
  //         lowVulnerabilitiesCount: 0,
  //         mediumVulnerabilitiesCount: 0,
  //       };
  //       const fakeProcess = { id: '10' };
  //       const fakeAction = { id: '20' };
  //       const fakeNextState = {
  //         id: '99',
  //         name: 'name',
  //         nameFa: 'nameFa',
  //         processId: 'processId',
  //         order: null,
  //         side: StateSideEnum.Applicant,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         deletedAt: null,
  //         _v: 1,
  //       };

  //       assessmentLayerRepository.findOne.mockResolvedValue(fakeLayer);
  //       jest
  //         .spyOn(service as any, 'getProcessAndAction')
  //         .mockResolvedValue({ process: fakeProcess, action: fakeAction });
  //       stateTransitionService.getNextStatus.mockResolvedValue(fakeNextState);
  //       const memberId = 'member-1';

  //       const result = await service.provideTestCases(
  //         'layer-1',
  //         { id: memberId } as Member,
  //         [],
  //       );

  //       expect(queryRunner.manager.update).toHaveBeenCalledWith(
  //         AssessmentLayer,
  //         { id: 'layer-1' },
  //         { stateId: '99' },
  //       );
  //       expect(queryRunner.commitTransaction).toHaveBeenCalled();
  //       expect(result).toBe(true);
  //     });

  //     it('should also update assessment request state when all layers match', async () => {
  //       const fakeLayer = {
  //         id: 'layer-1',
  //         iterationCount: 0,
  //         stateId: 'current-state',
  //         assessmentRequest: {
  //           id: 'req-1',
  //           requestNumber: 'REQ-2025-001',
  //           stateId: 'state-1',
  //           applicantId: 'member-1',
  //           applicantManagerId: 'member-1',
  //           cisoId: 'member-3',
  //           assetToAuditBaseline: 'baseline-1',
  //           environmentId: 'env-1',
  //           info: 'info',
  //           createdAt: new Date(),
  //           updatedAt: new Date(),
  //           deletedAt: null,
  //           _v: 1,
  //           finalState: RequestFinalStateEnum.Reject,
  //         },
  //         assessmentRequestId: 'request-id',
  //         assessmentTypeId: 'type-id',
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         deletedAt: null,
  //         _v: 1,
  //         criticalVulnerabilitiesCount: 0,
  //         highVulnerabilitiesCount: 0,
  //         lowVulnerabilitiesCount: 0,
  //         mediumVulnerabilitiesCount: 0,
  //       };
  //       const fakeProcess = { id: '10' };
  //       const fakeAction = { id: '20' };
  //       const fakeNextState = {
  //         id: '2',
  //         name: 'name',
  //         nameFa: 'nameFa',
  //         processId: 'processId',
  //         order: null,
  //         side: StateSideEnum.Assessment,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         deletedAt: null,
  //         _v: 1,
  //       };

  //       assessmentLayerRepository.findOne.mockResolvedValue(fakeLayer);
  //       jest
  //         .spyOn(service as any, 'getProcessAndAction')
  //         .mockResolvedValueOnce({ process: fakeProcess, action: fakeAction });
  //       stateTransitionService.getNextStatus.mockResolvedValue(fakeNextState);

  //       // simulate all layers in request already matching the new state
  //       (queryRunner.manager.find as jest.Mock).mockResolvedValue([fakeLayer]);

  //       // for request process/action
  //       jest
  //         .spyOn(service as any, 'getProcessAndAction')
  //         .mockResolvedValueOnce({ process: fakeProcess, action: fakeAction });
  //       stateTransitionService.getNextStatus.mockResolvedValueOnce({
  //         id: '77',
  //         name: 'name',
  //         nameFa: 'nameFa',
  //         processId: 'processId',
  //         order: null,
  //         side: StateSideEnum.Applicant,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         deletedAt: null,
  //         _v: 1,
  //       });
  //       const memberId = 'member-1';

  //       const result = await service.provideTestCases(
  //         'layer-1',
  //         { id: memberId } as Member,
  //         [],
  //       );

  //       expect(queryRunner.manager.update).toHaveBeenCalledWith(
  //         AssessmentLayer,
  //         { id: 'layer-1' },
  //         { stateId: '77' },
  //       );
  //       expect(result).toBe(true);
  //     });

  //     it('should rollback transaction if error occurs', async () => {
  //       assessmentLayerRepository.findOne.mockResolvedValue({
  //         id: 'layer-1',
  //         stateId: '1',
  //         iterationCount: 0,
  //         assessmentRequestId: 'request-id',
  //         assessmentTypeId: 'type-id',
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         deletedAt: null,
  //         _v: 1,
  //         criticalVulnerabilitiesCount: 0,
  //         highVulnerabilitiesCount: 0,
  //         lowVulnerabilitiesCount: 0,
  //         mediumVulnerabilitiesCount: 0,
  //       });
  //       jest
  //         .spyOn(service as any, 'getProcessAndAction')
  //         .mockRejectedValue(new Error('boom'));

  //       const memberId = 'member-1';

  //       await expect(
  //         service.provideTestCases('layer-1', { id: memberId } as Member, []),
  //       ).rejects.toThrow('boom');
  //       expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  //     });
  //   });

  //   describe('provideStatusReported', () => {
  //     it('should throw if requestLayer not found', async () => {
  //       assessmentLayerRepository.findOne.mockResolvedValue(null);
  //       const memberId = 'member-1';

  //       await expect(
  //         service.provideStatusReported(
  //           'layer-1',
  //           {
  //             action: ActionEnum.LayerAssessmentCompletedAccept,
  //           },
  //           { id: memberId } as Member,
  //           [],
  //         ),
  //       ).rejects.toThrow(BadRequestException);
  //     });

  //     it('should update layer state and commit transaction', async () => {
  //       (queryRunner.manager.find as jest.Mock).mockResolvedValue([]);
  //       (queryRunner.manager.findOne as jest.Mock).mockResolvedValue({});

  //       jest.spyOn(service as any, 'getProcessAndAction').mockResolvedValue({
  //         process: { id: 'proc-1' },
  //         action: { id: 'act-1' },
  //       });

  //       const fakeLayer = {
  //         id: 'layer-1',
  //         stateId: '1',
  //         iterationCount: 0,
  //         assessmentRequest: {
  //           id: 'req-1',
  //           requestNumber: 'REQ-2025-001',
  //           stateId: 'state-1',
  //           applicantId: 'member-1',
  //           applicantManagerId: 'member-1',
  //           cisoId: 'member-3',
  //           assetToAuditBaseline: 'baseline-1',
  //           environmentId: 'env-1',
  //           info: 'info',
  //           createdAt: new Date(),
  //           updatedAt: new Date(),
  //           deletedAt: null,
  //           _v: 1,
  //           finalState: RequestFinalStateEnum.Reject,
  //         },
  //         assessmentRequestId: 'request-id',
  //         assessmentTypeId: 'type-id',
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         deletedAt: null,
  //         _v: 1,
  //         criticalVulnerabilitiesCount: 0,
  //         highVulnerabilitiesCount: 0,
  //         lowVulnerabilitiesCount: 0,
  //         mediumVulnerabilitiesCount: 0,
  //       };
  //       const fakeNextState = {
  //         id: '99',
  //         name: 'name',
  //         nameFa: 'nameFa',
  //         processId: 'processId',
  //         order: null,
  //         side: StateSideEnum.Applicant,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         deletedAt: null,
  //         _v: 1,
  //       };
  //       assessmentLayerRepository.findOne.mockResolvedValue(fakeLayer);

  //       stateTransitionService.getNextStatus.mockResolvedValue(fakeNextState);

  //       const memberId = 'member-1';

  //       const result = await service.provideStatusReported(
  //         'layer-1',
  //         {
  //           action: ActionEnum.LayerAssessmentCompletedAccept,
  //         },
  //         { id: memberId } as Member,
  //         [],
  //       );

  //       expect(queryRunner.manager.update).toHaveBeenCalledWith(
  //         AssessmentLayer,
  //         { id: 'layer-1' },
  //         { stateId: '99', iterationCount: 0 },
  //       );

  //       expect(queryRunner.commitTransaction).toHaveBeenCalled();
  //       expect(result).toBe(true);
  //     });
  //   });

  //   describe('compareTestcases', () => {
  //     it('should return empty missing and extra when contents match required items', () => {
  //       const contents: TestcaseContent[] = [
  //         { id: 'c1', testcaseItemId: 'i1' } as TestcaseContent,
  //         { id: 'c2', testcaseItemId: 'i2' } as TestcaseContent,
  //       ];

  //       const requiredItems: TestcaseItem[] = [
  //         { id: 'i1', name: 'Item 1' } as TestcaseItem,
  //         { id: 'i2', name: 'Item 2' } as TestcaseItem,
  //       ];

  //       const result = (service as any).compareTestcases(
  //         contents,
  //         requiredItems,
  //       );

  //       expect(result.missing).toEqual([]);
  //       expect(result.extra).toEqual([]);
  //     });

  //     it('should return missing items when required are not in contents', () => {
  //       const contents: TestcaseContent[] = [
  //         { id: 'c1', testcaseItemId: 'i1' } as TestcaseContent,
  //       ];

  //       const requiredItems: TestcaseItem[] = [
  //         { id: 'i1', name: 'Item 1' } as TestcaseItem,
  //         { id: 'i2', name: 'Item 2' } as TestcaseItem,
  //       ];

  //       const result = (service as any).compareTestcases(
  //         contents,
  //         requiredItems,
  //       );

  //       expect(result.missing).toEqual([requiredItems[1]]);
  //       expect(result.extra).toEqual([]);
  //     });

  //     it('should return extra contents when contents include non-required items', () => {
  //       const contents: TestcaseContent[] = [
  //         { id: 'c1', testcaseItemId: 'i1' } as TestcaseContent,
  //         { id: 'c2', testcaseItemId: 'i999' } as TestcaseContent,
  //       ];

  //       const requiredItems: TestcaseItem[] = [
  //         { id: 'i1', name: 'Item 1' } as TestcaseItem,
  //       ];

  //       const result = (service as any).compareTestcases(
  //         contents,
  //         requiredItems,
  //       );

  //       expect(result.missing).toEqual([]);
  //       expect(result.extra).toEqual([contents[1]]);
  //     });

  //     it('should return both missing and extra when applicable', () => {
  //       const contents: TestcaseContent[] = [
  //         { id: 'c1', testcaseItemId: 'i999' } as TestcaseContent,
  //       ];

  //       const requiredItems: TestcaseItem[] = [
  //         { id: 'i1', name: 'Item 1' } as TestcaseItem,
  //       ];

  //       const result = (service as any).compareTestcases(
  //         contents,
  //         requiredItems,
  //       );

  //       expect(result.missing).toEqual([requiredItems[0]]);
  //       expect(result.extra).toEqual([contents[0]]);
  //     });

  //     it('should return empty arrays when both inputs are empty', () => {
  //       const result = (service as any).compareTestcases([], []);

  //       expect(result.missing).toEqual([]);
  //       expect(result.extra).toEqual([]);
  //     });
  //   });
  // });
});
