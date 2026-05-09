import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionLogModule } from 'src/action-log/action-log.module';
import { TestcaseModule } from 'src/test-case/test-case.module';
import { TestcaseRemediateController } from './controllers/test-case-remediate.controller';
import { TestcaseRemediate } from './entities/test-case-remediate.entity';
import { TestcaseRemediateRepository } from './repositories/test-case-remediate.repository';
import { TestcaseRemediateService } from './services/test-case-remediate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TestcaseRemediate]),
    ActionLogModule,
    TestcaseModule,
  ],
  controllers: [TestcaseRemediateController],
  providers: [TestcaseRemediateService, TestcaseRemediateRepository],
  exports: [TestcaseRemediateRepository],
})
export class TestcaseRemediateModule {}
