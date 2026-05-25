import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private readonly folderPath = path.join(__dirname, '../../temp/error');

  //------------------------------
  onModuleInit() {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn('Skipping Cron Job, Not In Production Mode');
    }
  }

  //------------------------------
  @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_11PM)
  async handleCron() {
    try {
      this.logger.log('Running Cleanup Job At 2:00 AM...');
      await this.clearErrorFolder();
    } catch (error) {
      console.log('Error In Running Cleanup Job : ', error.message);
    }
  }

  //------------------------------
  private async clearErrorFolder() {
    if (fs.existsSync(this.folderPath)) {
      fs.readdir(this.folderPath, (err, files) => {
        if (err) {
          this.logger.error(`Error Reading Directory...: ${err.message}`);
          return;
        }

        for (const file of files) {
          fs.unlink(path.join(this.folderPath, file), (err) => {
            if (err) {
              this.logger.error(
                `Error Deleting File ${file} ...: ${err.message}`,
              );
            }
          });
        }

        this.logger.log(`Cleared All Files In ${this.folderPath} ...`);
      });
    } else {
      this.logger.warn(`Folder ${this.folderPath} Does Not Exist`);
    }
  }
}
