export const ElasticsearchClient = {
  instance: {
    client: {
      indices: { create: jest.fn(), delete: jest.fn(), refresh: jest.fn() },
      bulk: jest.fn(),
      index: jest.fn(),
      update: jest.fn(),
    },
  },
};
