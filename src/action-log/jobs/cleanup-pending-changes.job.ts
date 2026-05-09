import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActionLogBufferService } from '../services/action-log-buffer.service';

@Injectable()
export class CleanupPendingChangesJob {
  private readonly logger = new Logger(CleanupPendingChangesJob.name);

  constructor(private actionLogBufferService: ActionLogBufferService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanup() {
    this.logger.log('Starting cleanup of flushed pending changes...');
    try {
      const deletedCount =
        await this.actionLogBufferService.cleanupFlushedChanges(7);
      this.logger.log(`Cleanup completed. Deleted ${deletedCount} records.`);
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`, error.stack);
    }
  }
}
