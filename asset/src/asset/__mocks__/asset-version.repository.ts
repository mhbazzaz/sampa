export const mockAssetVersionRepository = {
  save: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  findAndDelete: jest.fn(),
  deleteMany: jest.fn(),
  findAllPagination: jest.fn(),
  findAllPaginationWithFilter: jest.fn(),
  findAllPaginationWithOutFilter: jest.fn(),
  findAllPaginationWithFilterForReport: jest.fn(),
};
