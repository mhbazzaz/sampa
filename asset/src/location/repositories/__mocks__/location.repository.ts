export const mockLocationRepository = {
  save: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  findAndDelete: jest.fn(),
  findAllPagination: jest.fn(),
  findAllPaginateAdminScope: jest.fn(),
  findAllPaginateUserScope: jest.fn(),
  findOneCaseInsensitive: jest.fn(),
};
