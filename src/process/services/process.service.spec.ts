import { Test, TestingModule } from '@nestjs/testing';
import { ProcessRepositoryMock } from '../__mocks__/process.repository';
import { Process } from '../entities/process.entity';
import { ProcessRepository } from '../repositories/process.repository';
import { ProcessService } from './process.service';

describe('ProcessService', () => {
  let service: ProcessService;
  let repository: typeof ProcessRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessService,
        {
          provide: ProcessRepository,
          useValue: ProcessRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ProcessService>(ProcessService);
    repository = module.get(ProcessRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a permission group', async () => {
      const permissionGroup = { name: 'Admin Group' } as Process;
      repository.save.mockResolvedValue(permissionGroup);

      const result = await service.create(permissionGroup);

      expect(result).toEqual(permissionGroup);
      expect(repository.save).toHaveBeenCalledWith(permissionGroup);
    });
  });

  describe('findOne', () => {
    it('should find one permission group', async () => {
      const permissionGroup = { name: 'Admin Group' } as Process;
      repository.findOne.mockResolvedValue(permissionGroup);

      const result = await service.findOne({ where: { name: 'Admin Group' } });

      expect(result).toEqual(permissionGroup);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: 'Admin Group' },
      });
    });
  });

  describe('findAll', () => {
    it('should find all permission groups', async () => {
      const permissionGroups = [
        { name: 'Admin Group' },
        { name: 'User Group' },
      ] as Process[];

      repository.findAll.mockResolvedValue(permissionGroups);
      const result = await service.findAll();

      expect(result).toEqual(permissionGroups);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a permission group', async () => {
      const updateData = {
        name: 'Updated Admin Group',
      } as Partial<Process>;

      repository.update.mockResolvedValue(null);
      await service.update({ name: 'Admin Group' }, updateData);

      expect(repository.update).toHaveBeenCalledWith(
        { name: 'Admin Group' },
        updateData,
      );
    });
  });

  describe('remove', () => {
    it('should remove a permission group', async () => {
      repository.findAndDelete.mockResolvedValue(null);
      await service.remove({ name: 'Admin Group' });

      expect(repository.findAndDelete).toHaveBeenCalledWith({
        name: 'Admin Group',
      });
    });
  });

  describe('findAllPagination', () => {
    it('should find all permission groups with pagination', async () => {
      const permissionGroups = [
        { name: 'Admin Group' },
        { name: 'User Group' },
      ] as Process[];

      repository.findAllPagination.mockResolvedValue([permissionGroups, 2]);
      const result = await service.findAllPagination(0, 10);

      expect(result).toEqual([permissionGroups, 2]);
      expect(repository.findAllPagination).toHaveBeenCalledWith(0, 10, {
        order: { name: 'DESC' },
      });
    });
  });
});
