import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionLogModule } from './action-log/action-log.module';
import { CleanupPendingChangesJob } from './action-log/jobs/cleanup-pending-changes.job';
import { ActionModule } from './action/action.module';
import { AssessmentModule } from './assessment/assessment.module';
import { AssetModule } from './asset/asset.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { typeOrmConfig } from './config/typeorm-config';
import { EnvironmentModule } from './environment/environment.module';
import { FileModule } from './file/file.module';
import { GroupMembershipModule } from './group-membership/group-membership.module';
import { GroupModule } from './group/group.module';
import { AppI18nModule } from './i18n/i18n.module';
import { LayerCommentsModule } from './layer-comment/layer-comment.module';
import { LoggerModule } from './logger/logger.module';
import { MemberModule } from './member/member.module';
import { ProcessModule } from './process/process.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RemediateCommentModule } from './remediate-comment/remediate-comment.module';
import { RequestCommentsModule } from './request-comment/request-comment.module';
import { RoleModule } from './role/role.module';
import { SpecCommentsModule } from './spec-comment/spec-comment.module';
import { SpecModule } from './spec/spec.module';
import { StateTransitionModule } from './state-transition/state-transition.module';
import { TestCaseCommentsModule } from './test-cace-comment/test-case-comment.module';
import { TestcaseRemediateModule } from './test-case-remediate/test-case-remediate.module';
import { TestcaseModule } from './test-case/test-case.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ScheduleModule.forRoot(),
    LoggerModule,
    AppI18nModule,
    ActionLogModule,
    GroupMembershipModule,
    GroupModule,
    AssetModule,
    RoleModule,
    ActionModule,
    ProcessModule,
    MemberModule,
    AssessmentModule,
    TestcaseModule,
    EnvironmentModule,
    StateTransitionModule,
    SpecModule,
    TestCaseCommentsModule,
    LayerCommentsModule,
    RequestCommentsModule,
    FileModule,
    RabbitMQModule,
    SpecCommentsModule,
    TestcaseModule,
    TestcaseRemediateModule,
    RemediateCommentModule,
  ],
  controllers: [],
  providers: [CleanupPendingChangesJob],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
