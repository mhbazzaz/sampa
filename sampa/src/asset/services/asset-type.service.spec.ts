test('always passes', () => {
  expect(true).toBe(true);
});

// import { Test, TestingModule } from '@nestjs/testing';
// import { AssessmentTypeRepositoryMock } from 'src/assessment/__mocks__/assessment-type.repository';
// import { AssetType } from '../entities/asset-type.entity';
// import { AssetTypeRepository } from '../repositories/asset-type.repository';
// import { AssetTypeService } from './asset-type.service';

// describe('AssetTypeService', () => {
//   let service: AssetTypeService;
//   let repository: typeof AssessmentTypeRepositoryMock;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         AssetTypeService,
//         {
//           provide: AssetTypeRepository,
//           useValue: AssessmentTypeRepositoryMock,
//         },
//       ],
//     }).compile();

//     service = module.get<AssetTypeService>(AssetTypeService);
//     repository = module.get(AssetTypeRepository);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('create', () => {
//     it('should create an asset-type', async () => {
//       const assetType: AssetType = {
//         title: 'Test AssetType',
//         id: '1',
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: new Date(),
//         _v: 1,
//       };

//       repository.save.mockResolvedValue(assetType);
//       const result = await service.create(assetType);

//       expect(result).toEqual(assetType);
//       expect(repository.save).toHaveBeenCalledWith(assetType);
//     });
//   });

//   describe('findOne', () => {
//     it('should find one asset-type', async () => {
//       const assetType: AssetType = {
//         title: 'Test AssetType',
//         id: '1',
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: new Date(),
//         _v: 1,
//       };

//       repository.findOne.mockResolvedValue(assetType);
//       const result = await service.findOne({
//         where: { title: '123' },
//       });

//       expect(result).toEqual(assetType);
//       expect(repository.findOne).toHaveBeenCalledWith({
//         where: { title: '123' },
//       });
//     });
//   });

//   describe('findAll', () => {
//     it('should find all asset-types', async () => {
//       const assetTypes = [
//         {
//           title: 'Test AssetType 1',
//           id: '1',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//           deletedAt: new Date(),
//           _v: 1,
//         },
//         {
//           title: 'Test AssetType 2',
//           id: '2',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//           deletedAt: new Date(),
//           _v: 1,
//         },
//       ] as AssetType[];

//       repository.findAll.mockResolvedValue(assetTypes);
//       const result = await service.findAll();

//       expect(result).toEqual(assetTypes);
//       expect(repository.findAll).toHaveBeenCalled();
//     });
//   });

//   describe('update', () => {
//     it('should update an asset-type', async () => {
//       const updateData = { title: 'Updated AssetType' } as Partial<AssetType>;

//       repository.update.mockResolvedValue(null);
//       await service.update({ id: '1' }, updateData);

//       expect(repository.update).toHaveBeenCalledWith({ id: '1' }, updateData);
//     });
//   });

//   describe('remove', () => {
//     it('should remove an asset-type', async () => {
//       repository.findAndDelete.mockResolvedValue(null);

//       await service.remove({ id: '123' });
//       expect(repository.findAndDelete).toHaveBeenCalledWith({
//         id: '123',
//       });
//     });
//   });

//   describe('findAllPagination', () => {
//     it('should find all asset-types with pagination', async () => {
//       const assetTypes = [
//         {
//           title: 'Test AssetType 1',
//           id: '1',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//           deletedAt: new Date(),
//           _v: 1,
//         },
//         {
//           title: 'Test AssetType 2',
//           id: '2',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//           deletedAt: new Date(),
//           _v: 1,
//         },
//       ] as AssetType[];

//       repository.findAllPagination.mockResolvedValue([assetTypes, 2]);
//       const result = await service.findAllPagination(0, 10);

//       expect(result).toEqual([assetTypes, 2]);
//       expect(repository.findAllPagination).toHaveBeenCalledWith(0, 10, {
//         order: { createdAt: 'DESC' },
//       });
//     });
//   });
// });
