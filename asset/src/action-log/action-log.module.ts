import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionLogController } from './controllers/action-log.controller';
import { ActionLog } from './entities/action-log.entity';
import { ActionLogRepository } from './repositories/action-log.repository';
import { ActionLogService } from './services/action-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([ActionLog])],
  controllers: [ActionLogController],
  providers: [ActionLogService, ActionLogRepository],
  exports: [ActionLogRepository],
})
export class ActionLogModule {}
