export const TestCaseCommentRepositoryMock = {
  save: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  findAndDelete: jest.fn(),
  findAllPagination: jest.fn(),
  updateTransactional: jest.fn(),
  createTransactional: jest.fn(),
  findOneWithEnabledRelations: jest.fn(),
  findAllWithEnabledRelations: jest.fn(),
};
