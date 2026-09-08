// import { Test, TestingModule } from '@nestjs/testing';
// import { EnvironmentRepositoryMock } from '../__mocks__/environment.repository';
// import { Environment } from '../entities/environment.entity';
// import { EnvironmentRepository } from '../repositories/environment.repository';
// import { EnvironmentService } from './environment.service';

// describe('EnvironmentService', () => {
//   let service: EnvironmentService;
//   let repository: typeof EnvironmentRepositoryMock;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         EnvironmentService,
//         {
//           provide: EnvironmentRepository,
//           useValue: EnvironmentRepositoryMock,
//         },
//       ],
//     }).compile();

//     service = module.get<EnvironmentService>(EnvironmentService);
//     repository = module.get(EnvironmentRepository);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('create', () => {
//     it('should create an environment', async () => {
//       const Environment: Environment = {
//         name: 'Test Environment',
//         id: '1',
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: new Date(),
//         _v: 1,
//       };

//       repository.save.mockResolvedValue(Environment);
//       const result = await service.create(Environment);

//       expect(result).toEqual(Environment);
//       expect(repository.save).toHaveBeenCalledWith(Environment);
//     });
//   });

//   describe('findOne', () => {
//     it('should find one environment', async () => {
//       const Environment: Environment = {
//         name: 'Test Environment',
//         id: '1',
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: new Date(),
//         _v: 1,
//       };

//       repository.findOne.mockResolvedValue(Environment);
//       const result = await service.findOne({
//         where: { id: '1' },
//       });

//       expect(result).toEqual(Environment);
//       expect(repository.findOne).toHaveBeenCalledWith({
//         where: { id: '1' },
//       });
//     });
//   });

//   describe('findAll', () => {
//     it('should find all environments', async () => {
//       const Environments = [
//         {
//           name: 'Test Environment 1',
//           id: '1',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//           deletedAt: new Date(),
//           _v: 1,
//         },
//         {
//           name: 'Test Environment 2',
//           id: '2',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//           deletedAt: new Date(),
//           _v: 1,
//         },
//       ] as Environment[];

//       repository.findAll.mockResolvedValue(Environments);
//       const result = await service.findAll();

//       expect(result).toEqual(Environments);
//       expect(repository.findAll).toHaveBeenCalled();
//     });
//   });

//   describe('update', () => {
//     it('should update an environment', async () => {
//       const updateData = {
//         name: 'Updated Environment',
//       } as Partial<Environment>;

//       repository.update.mockResolvedValue(null);
//       await service.update({ id: '1' }, updateData);

//       expect(repository.update).toHaveBeenCalledWith({ id: '1' }, updateData);
//     });
//   });

//   describe('findAllPagination', () => {
//     it('should find all environments with pagination', async () => {
//       const environments = [
//         {
//           name: 'Test Environment 1',
//           id: '1',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//           deletedAt: new Date(),
//           _v: 1,
//         },
//         {
//           name: 'Test Environment 2',
//           id: '2',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//           deletedAt: new Date(),
//           _v: 1,
//         },
//       ] as Environment[];

//       repository.findAllPagination.mockResolvedValue([environments, 2]);
//       const result = await service.findAllPagination(0, 10);

//       expect(result).toEqual([environments, 2]);
//       expect(repository.findAllPagination).toHaveBeenCalledWith(0, 10, {
//         order: { createdAt: 'DESC' },
//       });
//     });
//   });
// });

describe('EnvironmentService', () => {
  it('should', () => {});
});
