import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionLogModule } from 'src/action-log/action-log.module';
import { ActionModule } from 'src/action/action.module';
import { AssetModule } from 'src/asset/asset.module';
import { EnvironmentModule } from 'src/environment/environment.module';
import { GroupMembershipModule } from 'src/group-membership/group-membership.module';
import { MemberModule } from 'src/member/member.module';
import { ProcessModule } from 'src/process/process.module';
import { RequestCommentsModule } from 'src/request-comment/request-comment.module';
import { RequestSpecItem } from 'src/spec/entities/request-spec-item.entity';
import { RequestSpecItemRepository } from 'src/spec/repositories/request-spec-item.repository';
import { StateTransitionModule } from 'src/state-transition/state-transition.module';
import { StatesModule } from 'src/states/states.module';
import { TestcaseModule } from 'src/test-case/test-case.module';
import { AssessmentLayerController } from './controllers/assessment-layer.controller';
import { AssessmentTypeController } from './controllers/assessment-type.controller';
import { AssessmentController } from './controllers/assessment.controller';
import { AssessmentLayer } from './entities/assessment-layer.entity';
import { AssessmentRequest } from './entities/assessment-request.entity';
import { AssessmentTeam } from './entities/assessment-team.entity';
import { AssessmentType } from './entities/assessment-type.entity';
import { AssessmentLayerRepository } from './repositories/assessment-layer.repository';
import { AssessmentRequestRepository } from './repositories/assessment-request.repository';
import { AssessmentTeamRepository } from './repositories/assessment-team.repository';
import { AssessmentTypeRepository } from './repositories/assessment-type.repository';
import { AssessmentLayerService } from './services/assessment-layer.service';
import { AssessmentRequestService } from './services/assessment-request.service';
import { AssessmentTeamService } from './services/assessment-team.service';
import { AssessmentTypeService } from './services/assessment-type.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssessmentType,
      AssessmentTeam,
      AssessmentRequest,
      AssessmentLayer,
      RequestSpecItem,
    ]),
    ActionLogModule,
    EnvironmentModule,
    AssetModule,
    ActionModule,
    StateTransitionModule,
    ProcessModule,
    MemberModule,
    GroupMembershipModule,
    StatesModule,
    RequestCommentsModule,
    forwardRef(() => TestcaseModule),
  ],
  controllers: [
    AssessmentController,
    AssessmentTypeController,
    AssessmentLayerController,
  ],
  providers: [
    AssessmentRequestService,
    AssessmentRequestRepository,
    AssessmentLayerService,
    AssessmentLayerRepository,
    AssessmentTypeService,
    AssessmentTypeRepository,
    AssessmentTeamService,
    AssessmentTeamRepository,
    RequestSpecItemRepository,
  ],
  exports: [
    AssessmentLayerRepository,
    AssessmentTypeRepository,
    AssessmentRequestRepository,
  ],
})
export class AssessmentModule {}
