import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { I18nService } from 'nestjs-i18n';
import { Vault } from 'src/vault/vault';
import { GetActionLogQueryDto } from '../dto/input/get-action-log-query.dto';
import { ActionLog } from '../entities/action-log.entity';
import { ActionLogRepository } from '../repositories/action-log.repository';

@Injectable()
export class ActionLogService {
  constructor(
    private readonly actionLogRepository: ActionLogRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async getDetailedLogs(
    assessmentRequestId: string,
    query: GetActionLogQueryDto,
  ) {
    const logs = await this.actionLogRepository.getDetailedLogs(
      assessmentRequestId,
      query,
    );

    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    const users: Record<string, unknown> = {};

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if (users[log.userId]) {
        log.user = users[log.userId] as any;
        continue;
      }
      try {
        const { data } = await axios.get(
          `${IDP_SERVICE_URL}/idp/api/v1/users/${log.userId}`,
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );
        users[log.userId] = data.data;
        log.user = data.data;
      } catch (error) {
        console.log(`Failed to fetch user for ID ${log.userId}:`, error);
        (log as any).user = null;
      }
    }

    const dataToReturn: {
      assessmentRequest: ActionLog[];
      assessmentLayers: Record<string, ActionLog[]>;
    } = { assessmentRequest: [], assessmentLayers: {} };

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      if (!log.assessmentLayerId) {
        dataToReturn.assessmentRequest.push(log);
      } else {
        if (!dataToReturn.assessmentLayers[log.assessmentLayerId]) {
          dataToReturn.assessmentLayers[log.assessmentLayerId] = [];
        }
        dataToReturn.assessmentLayers[log.assessmentLayerId].push(log);
      }
    }

    return dataToReturn;
  }
}
