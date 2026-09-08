import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Vault } from 'src/vault/vault';

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);
  constructor() {}

  async sendLog(metadata: Record<string, any>, level: string): Promise<void> {
    const payload = {
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      metadata,
    };

    const LOGGER_SERVICE_URL = await Vault.instance.get(
      'LOGGER_SERVICE_URL',
      'share',
    );

    try {
      await axios.post(`${LOGGER_SERVICE_URL}/logs`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      const errMsg = error.response?.data || error.message;
      this.logger.error('Logger Service Failed:', errMsg);
    }
  }
}
