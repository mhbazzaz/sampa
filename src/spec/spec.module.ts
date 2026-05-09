import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionLogModule } from 'src/action-log/action-log.module';
import { AssessmentModule } from 'src/assessment/assessment.module';
import { AssetModule } from 'src/asset/asset.module';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { EnvironmentModule } from 'src/environment/environment.module';
import { GroupMembershipModule } from 'src/group-membership/group-membership.module';
import { RequestSpecContentController } from './controllers/request-spec-content.controller';
import { RequestSpecGroupController } from './controllers/request-spec-group.controller';
import { RequestSpecItemController } from './controllers/request-spec-item.controller';
import { RequestSpecContent } from './entities/request-spec-content.entity';
import { RequestSpecGroup } from './entities/request-spec-group.entity';
import { RequestSpecItem } from './entities/request-spec-item.entity';
import { RequestSpecContentRepository } from './repositories/request-spec-content.repository';
import { RequestSpecGroupRepository } from './repositories/request-spec-group.repository';
import { RequestSpecItemRepository } from './repositories/request-spec-item.repository';
import { RequestSpecContentService } from './services/request-spec-content.service';
import { RequestSpecGroupService } from './services/request-spec-group.service';
import { RequestSpecItemService } from './services/request-spec-item.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequestSpecContent,
      RequestSpecGroup,
      RequestSpecItem,
    ]),
    ActionLogModule,
    AssetModule,
    EnvironmentModule,
    AssessmentModule,
    GroupMembershipModule,
    AssessmentModule,
  ],
  controllers: [
    RequestSpecItemController,
    RequestSpecGroupController,
    RequestSpecContentController,
  ],
  providers: [
    RequestSpecContentService,
    RequestSpecContentRepository,
    RequestSpecGroupService,
    RequestSpecGroupRepository,
    RequestSpecItemService,
    RequestSpecItemRepository,
    ValidationService,
  ],
  exports: [
    RequestSpecContentRepository,
    RequestSpecItemRepository,
    RequestSpecGroupRepository,
  ],
})
export class SpecModule {}
