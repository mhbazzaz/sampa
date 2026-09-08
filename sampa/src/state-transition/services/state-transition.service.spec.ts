import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { State } from 'src/states/entities/state.entity';
import { StateTransition } from '../entities/state-transition.entity';
import { StateTransitionRepository } from '../repositories/state-transition.repository';
import { StateTransitionService } from './state-transition.service';

describe('StateTransitionService', () => {
  let service: StateTransitionService;
  let repo: jest.Mocked<StateTransitionRepository>;
  let i18n: jest.Mocked<I18nService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StateTransitionService,
        {
          provide: StateTransitionRepository,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockReturnValue('translated-error'),
          },
        },
      ],
    }).compile();

    service = module.get<StateTransitionService>(StateTransitionService);
    repo = module.get(StateTransitionRepository);
    i18n = module.get(I18nService);
  });

  describe('findAll', () => {
    it('should return all state transitions', async () => {
      const mockTransitions = [{ id: '1' }] as StateTransition[];
      repo.findAll.mockResolvedValue(mockTransitions);

      const result = await service.findAll();

      expect(result).toEqual(mockTransitions);
      expect(repo.findAll).toHaveBeenCalledWith({
        relations: { action: true, nextState: true, process: true },
      });
    });
  });

  describe('getNextStatus', () => {
    it('should return next state when transition exists', async () => {
      const mockState = { id: 'state-1' } as State;
      const mockTransition = {
        id: 'trans-1',
        nextState: mockState,
      } as StateTransition;
      repo.findOne.mockResolvedValue(mockTransition);

      const result = await service.getNextStatus({
        processId: 'p1',
        actionId: 'a1',
        currentStateId: 's1',
      });

      expect(result).toBe(mockState);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { processId: 'p1', actionId: 'a1', currentStateId: 's1' },
        relations: { nextState: true },
      });
    });

    it('should throw BadRequestException if no transition found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.getNextStatus({
          processId: 'p1',
          actionId: 'a1',
          currentStateId: 's1',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith('messages.ERROR_NOT_FOUND_PROPERTY', {
        args: { property: 'state transition' },
      });
    });

    it('should throw BadRequestException if transition has no nextState', async () => {
      repo.findOne.mockResolvedValue({ id: 'trans-1', nextState: null } as any);

      await expect(
        service.getNextStatus({
          processId: 'p1',
          actionId: 'a1',
          currentStateId: 's1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllNextStatus', () => {
    it('should return all next states from transitions', async () => {
      const state1 = { id: 's1' } as State;
      const state2 = { id: 's2' } as State;

      repo.findAll.mockResolvedValue([
        { id: 't1', nextState: state1 } as StateTransition,
        { id: 't2', nextState: state2 } as StateTransition,
      ]);

      const result = await service.getAllNextStatus({
        processId: 'p1',
        actionId: 'a1',
      });

      expect(result).toEqual([state1, state2]);
      expect(repo.findAll).toHaveBeenCalledWith({
        where: { processId: 'p1', actionId: 'a1' },
        relations: { nextState: true },
      });
    });

    it('should throw BadRequestException if no next states found', async () => {
      repo.findAll.mockResolvedValue([
        {
          id: 't1',
          processId: '11',
          actionId: '11',
          currentStateId: '11',
          nextStateId: '11',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          _v: 1,
        } as StateTransition,
      ]);

      await expect(
        service.getAllNextStatus({ processId: 'p1', actionId: 'a1' }),
      ).rejects.toThrow(BadRequestException);

      expect(i18n.t).toHaveBeenCalledWith('messages.ERROR_NOT_FOUND_PROPERTY', {
        args: { property: 'state transition' },
      });
    });
  });
});
