import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentModule } from 'src/assessment/assessment.module';
import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { RequestSpecItem } from 'src/spec/entities/request-spec-item.entity';
import { RequestSpecItemRepository } from 'src/spec/repositories/request-spec-item.repository';
import { TestcaseModule } from 'src/test-case/test-case.module';
import { EnvironmentController } from './controllers/environment.controller';
import { Environment } from './entities/environment.entity';
import { EnvironmentRepository } from './repositories/environment.repository';
import { EnvironmentService } from './services/environment.service';
import { CheckEnvironmentExistValidator } from './validators/check-environment-exists.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([Environment, AssessmentRequest, RequestSpecItem]),
    forwardRef(() => TestcaseModule),
    forwardRef(() => AssessmentModule),
  ],
  controllers: [EnvironmentController],
  providers: [
    EnvironmentService,
    EnvironmentRepository,
    RequestSpecItemRepository,
    CheckEnvironmentExistValidator,
  ],
  exports: [EnvironmentService, EnvironmentRepository],
})
export class EnvironmentModule {}
