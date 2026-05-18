import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { I18nService } from 'nestjs-i18n';
import { Vault } from 'src/vault/vault';
import { ActionLogRepository } from '../repositories/action-log.repository';

@Injectable()
export class ActionLogService {
  constructor(
    private readonly actionLogRepository: ActionLogRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async getDetailedLogs(assetId: string) {
    const logs = await this.actionLogRepository.findAll({
      where: { assetId },
      order: { createdAt: 'ASC' },
    });

    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        if (log.userId) {
          try {
            const { data } = await axios.get(
              `${IDP_SERVICE_URL}/idp/api/v1/users/${log.userId}`,
              {
                headers: {
                  'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
                },
              },
            );
            log.user = data.data;
          } catch (error) {
            console.log(`Failed to fetch user for ID ${log.userId}:`, error);
            (log as any).user = null;
          }
        }

        return log;
      }),
    );

    return enrichedLogs;
  }
}
