import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentModule } from 'src/assessment/assessment.module';
import { AssetModule } from 'src/asset/asset.module';
import { CheckTestcaseGroupExistValidator } from 'src/common/validations/check-test-case-group-exists.validator';
import { EnvironmentModule } from 'src/environment/environment.module';
import { TestcaseContentController } from './controllers/test-case-content.controller';
import { TestcaseGroupController } from './controllers/test-case-group.controller';
import { TestcaseItemController } from './controllers/test-case-item.controller';
import { TestcaseContent } from './entities/testcase-content.entity';
import { TestcaseGroup } from './entities/testcase-group.entity';
import { TestcaseItem } from './entities/testcase-item.entity';
import { TestcaseContentRepository } from './repositories/test-case-content.repository';
import { TestcaseGroupRepository } from './repositories/testcase-group.repository';
import { TestcaseItemRepository } from './repositories/testcase-item.repository';
import { TestcaseContentService } from './services/test-case-content.service';
import { TestcaseGroupService } from './services/test-case-group.service';
import { TestcaseItemService } from './services/test-case-item.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TestcaseContent, TestcaseGroup, TestcaseItem]),
    forwardRef(() => EnvironmentModule),
    forwardRef(() => AssessmentModule),
    AssetModule,
  ],
  controllers: [
    TestcaseItemController,
    TestcaseGroupController,
    TestcaseContentController,
  ],
  providers: [
    TestcaseItemService,
    TestcaseItemRepository,
    TestcaseGroupService,
    TestcaseGroupRepository,
    TestcaseContentService,
    TestcaseContentRepository,
    CheckTestcaseGroupExistValidator,
  ],
  exports: [
    TestcaseItemRepository,
    TestcaseGroupRepository,
    TestcaseGroupService,
    TestcaseItemService,
    TestcaseContentService,
    TestcaseContentRepository,
  ],
})
export class TestcaseModule {}
