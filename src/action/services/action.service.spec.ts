import { Test, TestingModule } from '@nestjs/testing';
import { ActionTierEnum } from 'src/common/enums/action-tier.enum';
import { ActionRepositoryMock } from '../__mocks__/action.repository';
import { Action } from '../entities/action.entity';
import { ActionRepository } from '../repositories/action.repository';
import { ActionService } from './action.service';

describe('ActionService', () => {
  let service: ActionService;
  let repository: typeof ActionRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionService,
        {
          provide: ActionRepository,
          useValue: ActionRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ActionService>(ActionService);
    repository = module.get(ActionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a permission', async () => {
      const permission = {
        name: 'Read',
        tier: ActionTierEnum.BACKEND,
        processId: '1',
      } as Action;

      repository.save.mockResolvedValue(permission);
      const result = await service.create(permission);

      expect(result).toEqual(permission);
      expect(repository.save).toHaveBeenCalledWith(permission);
    });
  });

  describe('findOne', () => {
    it('should find one permission', async () => {
      const permission = {
        name: 'Read',
        tier: ActionTierEnum.BACKEND,
        processId: '1',
      } as Action;

      repository.findOne.mockResolvedValue(permission);
      const result = await service.findOne({ where: { name: 'Read' } });

      expect(result).toEqual(permission);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: 'Read' },
      });
    });
  });

  describe('findAll', () => {
    it('should find all permissions', async () => {
      const permissions = [
        { name: 'Read', tier: ActionTierEnum.BACKEND, processId: '1' },
      ] as Action[];

      repository.findAll.mockResolvedValue(permissions);
      const result = await service.findAll();

      expect(result).toEqual(permissions);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a permission', async () => {
      const updateData = { name: 'Updated Read' } as Partial<Action>;

      repository.update.mockResolvedValue(null);
      await service.update({ name: 'Read' }, updateData);

      expect(repository.update).toHaveBeenCalledWith(
        { name: 'Read' },
        updateData,
      );
    });
  });

  describe('remove', () => {
    it('should remove a permission', async () => {
      repository.findAndDelete.mockResolvedValue(null);

      await service.remove({ name: 'Read' });
      expect(repository.findAndDelete).toHaveBeenCalledWith({
        name: 'Read',
      });
    });
  });

  describe('findAllPagination', () => {
    it('should find all permissions with pagination', async () => {
      const permissions = [
        { name: 'Read', tier: ActionTierEnum.BACKEND, processId: '1' },
      ] as Action[];

      repository.findAllPagination.mockResolvedValue([permissions, 2]);

      const result = await service.findAllPagination(0, 10);

      expect(result).toEqual([permissions, 2]);
      expect(repository.findAllPagination).toHaveBeenCalledWith(0, 10, {
        order: { createdAt: 'DESC' },
      });
    });
  });
});
