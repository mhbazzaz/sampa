export const ActionLogBufferServiceMock = {
  addChange: jest.fn(),
  getPendingChanges: jest.fn(),
  flushToActionLog: jest.fn(),
  resolveStateIds: jest.fn(),
  getConfigForEntity: jest.fn(),
  cleanupFlushedChanges: jest.fn(),
};
