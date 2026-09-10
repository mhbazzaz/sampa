import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { EventScopeEnum } from 'src/common/enums/event-scope.enum';
import { Vault } from 'src/vault/vault';
import { FindAccessibleNotificationsQueryDto } from '../dto/input/find-accessible-notifications.dto';

const NOTIFICATION_TIMEOUT_MS = 15_000;

@Injectable()
export class NotificationManagementClient {
  private readonly logger = new Logger(NotificationManagementClient.name);

  async getAccessibleEvents(
    query: FindAccessibleNotificationsQueryDto,
    sourceIds: string[],
  ) {
    try {
      const [token, baseUrl] = await Promise.all([
        Vault.instance.get(
          'NOTIFICATION_MANAGEMENT_SERVICE_INTERNAL_TOKEN',
          'share',
        ),
        Vault.instance.get('NOTIFICATION_MANAGEMENT_SERVICE_URL'),
      ]);

      const { data } = await axios.get(
        `${baseUrl}/notification-management/api/v1/event/accessible`,
        {
          timeout: NOTIFICATION_TIMEOUT_MS,
          params: {
            ...query,
            scope: EventScopeEnum.SAMPA,
            sourceIds,
          },
          paramsSerializer: this.serializeParams,
          headers: {
            'x-internal-communication-token': token,
          },
        },
      );

      return data?.data?.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to fetch accessible notifications: ${axiosError.message}`,
        axiosError.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch accessible notifications',
      );
    }
  }

  private serializeParams(params: Record<string, unknown>): string {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          search.append(key, String(item));
        }
        continue;
      }

      search.append(key, String(value));
    }

    return search.toString();
  }
}
