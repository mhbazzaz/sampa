import { AbstractRepository } from './abstract.repository';

export const mockRepository = {
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
  findAll: jest.fn(),
  findAndDelete: jest.fn().mockResolvedValue({}),
};

export const mockI18n = {
  t: jest.fn(),
};

export class MockAbstractRepository extends AbstractRepository<any> {
  constructor() {
    super(mockRepository as any, mockI18n as any);
  }
}
