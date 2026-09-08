import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentTeamRepositoryMock } from '../__mocks__/assessment-team.repositry';
import { AssessmentTeam } from '../entities/assessment-team.entity';
import { AssessmentTeamRepository } from '../repositories/assessment-team.repository';
import { AssessmentTeamService } from './assessment-team.service';

describe('AssessmentTeamService', () => {
  let service: AssessmentTeamService;
  let repository: typeof AssessmentTeamRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentTeamService,
        {
          provide: AssessmentTeamRepository,
          useValue: AssessmentTeamRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<AssessmentTeamService>(AssessmentTeamService);
    repository = module.get(AssessmentTeamRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an assessment-team', async () => {
      const assessmentTeam = {
        isLead: true,
        isMember: false,
      };

      repository.save.mockResolvedValue(assessmentTeam);
      const result = await service.create(assessmentTeam);

      expect(result).toEqual(assessmentTeam);
      expect(repository.save).toHaveBeenCalledWith(assessmentTeam);
    });
  });

  describe('findOne', () => {
    it('should find one assessment-team', async () => {
      const assessmentTeam = {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        isLead: true,
        isMember: false,
        _v: 1,
      };

      repository.findOne.mockResolvedValue(assessmentTeam);
      const result = await service.findOne({ where: { id: '1' } });

      expect(result).toEqual(assessmentTeam);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('findAll', () => {
    it('should find all assessment-team', async () => {
      const AssessmentTeam = [
        {
          id: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          isLead: true,
          isMember: false,
          _v: 1,
        },
        {
          id: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          isLead: false,
          isMember: true,
          _v: 1,
        },
      ];

      repository.findAll.mockResolvedValue(AssessmentTeam);
      const result = await service.findAll();

      expect(result).toEqual(AssessmentTeam);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an assessment-team', async () => {
      const assessmentTeam = {
        isLead: true,
        isMember: false,
      } as Partial<AssessmentTeam>;

      repository.update.mockResolvedValue(null);
      await service.update({ id: '1' }, assessmentTeam);

      expect(repository.update).toHaveBeenCalledWith(
        { id: '1' },
        assessmentTeam,
      );
    });
  });

  describe('remove', () => {
    it('should remove an assessment-team', async () => {
      repository.findAndDelete.mockResolvedValue(null);
      await service.remove({ id: '1' });

      expect(repository.findAndDelete).toHaveBeenCalledWith({ id: '1' });
    });
  });

  describe('findAllPagination', () => {
    it('should find all assessment-team with pagination', async () => {
      const AssessmentTeam = [
        {
          id: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          isLead: true,
          isMember: false,
          _v: 1,
        },
        {
          id: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          isLead: false,
          isMember: true,
          _v: 1,
        },
      ];

      repository.findAllPagination.mockResolvedValue(AssessmentTeam);
      const result = await service.findAllPagination(0, 10);

      expect(result).toEqual(AssessmentTeam);
    });
  });
});
