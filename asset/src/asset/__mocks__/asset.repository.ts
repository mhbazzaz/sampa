export const mockAssetRepository = {
  save: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  findAndDelete: jest.fn(),
  createAssetWithVersions: jest.fn(),
  findAllPagination: jest.fn(),
};
