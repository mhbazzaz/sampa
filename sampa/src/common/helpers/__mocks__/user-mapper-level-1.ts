import { BadRequestException } from '@nestjs/common';

interface MockUser {
  id: string;
  name: string;
}

type MockUsers = Record<string, MockUser>;

const mockUserMapperLevel1 = jest
  .fn()
  .mockImplementation(async <T>(array: T[], fieldWithId: keyof T) => {
    if (!array || array.length === 0) {
      return;
    }

    const mockUsers: MockUsers = {
      user1: { id: 'user1', name: 'Test User 1' },
      user2: { id: 'user2', name: 'Test User 2' },
    };

    for (const item of array as any[]) {
      const userId = item[fieldWithId] as string;
      if (mockUsers[userId]) {
        item.user = mockUsers[userId];
      }
    }
  });

export const userMapperLevel1Mock = mockUserMapperLevel1;

interface AxiosErrors extends Error {
  isAxiosError: boolean;
  response?: {
    data: {
      message: string;
    };
  };
}

export const mockUserMapperError = () => {
  mockUserMapperLevel1.mockImplementationOnce(() => {
    throw new BadRequestException('Mocked error');
  });
};

export const mockUserMapperAxiosError = () => {
  mockUserMapperLevel1.mockImplementationOnce(() => {
    const error = new Error('Mocked axios error') as AxiosErrors;
    error.isAxiosError = true;
    error.response = {
      data: {
        message: 'Mocked axios error response',
      },
    };
    throw error;
  });
};

export default mockUserMapperLevel1;
