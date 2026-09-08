import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentType } from 'src/assessment/entities/assessment-type.entity';
import { AssetType } from 'src/asset/entities/asset-type.entity';
import { Environment } from 'src/environment/entities/environment.entity';
import { Member } from 'src/member/entities/member.entity';
import { RequestSpecItem } from 'src/spec/entities/request-spec-item.entity';
import { RequestSpecGroup } from 'src/spec/entities/request-spec-group.entity';
import { State } from 'src/states/entities/state.entity';
import { TestcaseContent } from 'src/test-case/entities/testcase-content.entity';
import { TestcaseGroup } from 'src/test-case/entities/testcase-group.entity';
import { TestcaseItem } from 'src/test-case/entities/testcase-item.entity';
import { ActionLogController } from './controllers/action-log.controller';
import { ActionLog } from './entities/action-log.entity';
import { PendingChange } from './entities/pending-change.entity';
import { CleanupPendingChangesJob } from './jobs/cleanup-pending-changes.job';
import { ActionLogRepository } from './repositories/action-log.repository';
import { ActionLogBufferService } from './services/action-log-buffer.service';
import { ActionLogService } from './services/action-log.service';
import { ChangelogConfigFactory } from './services/change-log-configs';
import { GenericChangelogService } from './services/generic-change-log.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActionLog,
      PendingChange,
      State,
      Member,
      Environment,
      AssessmentType,
      TestcaseGroup,
      TestcaseContent,
      TestcaseItem,
      RequestSpecItem,
      RequestSpecGroup,
      AssetType,
    ]),
  ],
  controllers: [ActionLogController],
  providers: [
    ActionLogService,
    ActionLogBufferService,
    CleanupPendingChangesJob,
    ActionLogRepository,
    GenericChangelogService,
    ChangelogConfigFactory,
  ],
  exports: [
    ActionLogBufferService,
    ActionLogRepository,
    GenericChangelogService,
    ChangelogConfigFactory,
  ],
})
export class ActionLogModule {}
