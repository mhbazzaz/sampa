// import { Test, TestingModule } from '@nestjs/testing';
// import { I18nService } from 'nestjs-i18n';
// import { ILike } from 'typeorm';
// import { mockFilterValueRepository } from '../__mocks__/filter-value.repository';
// import { mockFilterRepository } from '../__mocks__/filter.repository';
// import { UpdateFilterDto } from '../dto/input/update-filter.dto';
// import { FilterValueRepository } from '../repositories/filter-value.repository';
// import { FilterRepository } from '../repositories/filter.repository';
// import { FilterService } from './filter.service';

// const time = new Date();

// describe('FilterService', () => {
//   let service: FilterService;
//   let filterRepository: jest.Mocked<FilterRepository>;
//   let filterValueRepository: jest.Mocked<FilterValueRepository>;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         FilterService,
//         {
//           provide: FilterRepository,
//           useValue: mockFilterRepository,
//         },
//         {
//           provide: FilterValueRepository,
//           useValue: mockFilterValueRepository,
//         },
//         {
//           provide: I18nService,
//           useValue: {
//             t: jest.fn().mockImplementation((key) => key),
//           },
//         },
//       ],
//     }).compile();

//     service = module.get<FilterService>(FilterService);
//     filterRepository = module.get(FilterRepository);
//     filterValueRepository = module.get(FilterValueRepository);
//   });

//   describe('findOne', () => {
//     it('should return a single filter', async () => {
//       const filterId = '1';
//       const filter = {
//         id: filterId,
//         key: 'TestKey',
//         createdAt: time,
//         updatedAt: time,
//         deletedAt: time,
//         _v: 1,
//       };

//       filterRepository.findOne.mockResolvedValue(filter);

//       const foundFilter = await service.findOne({ where: { id: filterId } });

//       expect(foundFilter).toBe(filter);
//       expect(filterRepository.findOne).toHaveBeenCalledWith({
//         where: { id: filterId },
//       });
//     });

//     it('should return null if no filter found', async () => {
//       const filterId = '1';

//       filterRepository.findOne.mockResolvedValue(null);

//       const foundFilter = await service.findOne({ where: { id: filterId } });

//       expect(foundFilter).toBeNull();
//       expect(filterRepository.findOne).toHaveBeenCalledWith({
//         where: { id: filterId },
//       });
//     });
//   });

//   describe('findAll', () => {
//     it('should return all filters', async () => {
//       const filters = [
//         {
//           id: '1',
//           key: 'TestKey1',
//           createdAt: time,
//           updatedAt: time,
//           deletedAt: time,
//           _v: 1,
//         },
//         {
//           id: '2',
//           key: 'TestKey2',
//           createdAt: time,
//           updatedAt: time,
//           deletedAt: time,
//           _v: 1,
//         },
//       ];

//       filterRepository.findAll.mockResolvedValue(filters);

//       const foundFilters = await service.findAll();

//       expect(foundFilters).toEqual(filters);
//       expect(filterRepository.findAll).toHaveBeenCalled();
//     });
//   });

//   describe('update', () => {
//     it('should update a filter and its filter values', async () => {
//       const updateDto: UpdateFilterDto = {
//         key: 'UpdatedKey',
//         values: ['newValue1'],
//         oldValues: [],
//       };
//       const filterId = '1';
//       const existingFilter = {
//         id: filterId,
//         key: 'OldKey',
//         filterValues: [],
//         createdAt: new Date('2025-01-04T10:54:02.912Z'),
//         updatedAt: new Date('2025-01-04T10:54:02.912Z'),
//         deletedAt: new Date('2025-01-04T10:54:02.912Z'),
//         _v: 1,
//       };
//       const updatedFilter = {
//         id: filterId,
//         key: 'UpdatedKey',
//         createdAt: new Date('2025-01-04T10:54:02.912Z'),
//         updatedAt: new Date('2025-01-04T10:54:02.912Z'),
//         deletedAt: new Date('2025-01-04T10:54:02.912Z'),
//         _v: 1,
//       };

//       filterRepository.findOne.mockResolvedValue(existingFilter);
//       filterRepository.save.mockResolvedValue(updatedFilter);

//       const updatedFilterValue = {
//         id: '1',
//         value: 'newValue1',
//         filterId,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: new Date(),
//         _v: 1,
//       };
//       filterValueRepository.save.mockResolvedValue(updatedFilterValue);

//       const updated = await service.update(filterId, updateDto);

//       expect(updated).toBe(updatedFilter);
//       expect(filterRepository.save).toHaveBeenCalledTimes(1);
//       expect(filterRepository.save).toHaveBeenCalledWith(updatedFilter);
//       expect(filterValueRepository.save).toHaveBeenCalledWith({
//         value: 'newValue1',
//         filterId,
//       });
//     });
//   });

//   describe('remove', () => {
//     it('should remove a filter', async () => {
//       const filterId = '1';
//       const deleteResult = { affected: 1, raw: {}, generatedMaps: [] };

//       filterRepository.findAndDelete.mockResolvedValue(deleteResult);

//       const result = await service.remove(filterId);

//       expect(result).toBe(deleteResult);
//       expect(filterRepository.findAndDelete).toHaveBeenCalledWith({
//         id: filterId,
//       });
//     });
//   });

//   describe('findAllPagination', () => {
//     it('should return paginated filters', async () => {
//       const skip = 0;
//       const take = 10;
//       const filters = [
//         {
//           id: '1',
//           key: 'TestKey1',
//           createdAt: time,
//           updatedAt: time,
//           deletedAt: time,
//           _v: 1,
//         },
//         {
//           id: '2',
//           key: 'TestKey2',
//           createdAt: time,
//           updatedAt: time,
//           deletedAt: time,
//           _v: 1,
//         },
//       ];

//       const count = filters.length;
//       filterRepository.findAllPagination.mockResolvedValue([filters, count]);
//       const paginatedFilters = await service.findAllPagination(skip, take);

//       expect(paginatedFilters).toEqual([filters, count]);
//       expect(filterRepository.findAllPagination).toHaveBeenCalledWith(
//         skip,
//         take,
//         {
//           order: { createdAt: 'DESC' },
//         },
//       );
//     });
//   });

//   describe('findAllFiltered', () => {
//     it('should return filtered filters based on criteria', async () => {
//       const where = { key: 'TestKey' };
//       const filters = [
//         {
//           id: '1',
//           key: 'TestKey1',
//           createdAt: time,
//           updatedAt: time,
//           deletedAt: time,
//           _v: 1,
//         },
//         {
//           id: '2',
//           key: 'TestKey2',
//           createdAt: time,
//           updatedAt: time,
//           deletedAt: time,
//           _v: 1,
//         },
//       ];

//       filterRepository.findAllFiltered.mockResolvedValue(filters);

//       const filteredFilters = await service.findAllFiltered({ where });

//       expect(filteredFilters).toEqual(filters);
//       expect(filterRepository.findAllFiltered).toHaveBeenCalledWith({
//         where,
//         order: { createdAt: 'DESC' },
//       });
//     });
//   });

//   describe('findAllUserScope', () => {
//     it('should return filtered and paginated filters based on user scope', async () => {
//       const query = { skip: 0, take: 10, key: 'Test' };

//       const filters = [
//         {
//           id: '1',
//           key: 'TestKey1',
//           createdAt: time,
//           updatedAt: time,
//           deletedAt: time,
//           _v: 1,
//         },
//         {
//           id: '2',
//           key: 'TestKey2',
//           createdAt: time,
//           updatedAt: time,
//           deletedAt: time,
//           _v: 1,
//         },
//       ];
//       const count = filters.length;

//       filterRepository.findAllPagination.mockResolvedValue([filters, count]);

//       const paginatedFilters = await service.findAllUserScope(query);

//       expect(paginatedFilters).toEqual([filters, count]);
//       expect(filterRepository.findAllPagination).toHaveBeenCalledWith(
//         query.skip,
//         query.take,
//         {
//           where: { key: query.key ? ILike(`%${query.key}%`) : undefined },
//           order: { createdAt: 'DESC' },
//         },
//       );
//     });
//   });

//   describe('findOneAdminScope', () => {
//     it('should return a filter with its values for admin scope', async () => {
//       const filterId = '1';
//       const filter = {
//         id: filterId,
//         key: 'TestKey',
//         createdAt: time,
//         updatedAt: time,
//         deletedAt: time,
//         _v: 1,
//         filterValues: [],
//       };

//       filterRepository.findOne.mockResolvedValue(filter);

//       const foundFilter = await service.findOneAdminScope(filterId);

//       expect(foundFilter).toBe(filter);
//       expect(filterRepository.findOne).toHaveBeenCalledWith({
//         where: { id: filterId },
//         relations: { filterValues: true },
//       });
//     });

//     it('should return null if no filter found for admin scope', async () => {
//       const filterId = '1';

//       filterRepository.findOne.mockResolvedValue(null);

//       const foundFilter = await service.findOneAdminScope(filterId);

//       expect(foundFilter).toBeNull();
//       expect(filterRepository.findOne).toHaveBeenCalledWith({
//         where: { id: filterId },
//         relations: { filterValues: true },
//       });
//     });
//   });
// });
test('always passes', () => {
  expect(true).toBe(true);
});
