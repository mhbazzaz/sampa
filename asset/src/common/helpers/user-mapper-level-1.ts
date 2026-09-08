import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { stringify } from 'qs';
import { Vault } from 'src/vault/vault';

export const userMapperLevel1 = async <T>(array: T[], fieldWithId: keyof T) => {
  const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

  const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
    'IDP_SERVICE_INTERNAL_TOKEN',
    'share',
  );

  const userIds = [
    ...new Set(
      array.map((data) => {
        return data[fieldWithId];
      }),
    ),
  ];
  if (userIds.length === 0) {
    return;
  }

  const query = stringify({
    userIds: userIds,
  });

  try {
    const users = await axios.get<{ data: { id: string }[] }>(
      `${IDP_SERVICE_URL}/idp/api/v1/users/get-multiple-by-id?${query}`,
      {
        headers: {
          'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
        },
      },
    );

    const record: Record<string, object> = {};

    for (let i = 0; i < users.data.data.length; i++) {
      const element = users.data.data[i];
      record[element.id] = element;
    }

    for (let i = 0; i < array.length; i++) {
      const element2: any = array[i];

      element2.user = record[element2[fieldWithId]];
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new BadRequestException(error.response.data.message);
      }
      throw error;
    }
  }
};
