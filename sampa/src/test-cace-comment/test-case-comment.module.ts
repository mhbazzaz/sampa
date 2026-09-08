import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestcaseModule } from 'src/test-case/test-case.module';
import { TestCaseCommentController } from './controllers/test-case-comment.controller';
import { TestCaseComment } from './entities/test-case-comment.entity';
import { TestCaseCommentRepository } from './repositories/test-case-comment.repository';
import { TestCaseCommentService } from './services/test-case-comment.service';

@Module({
  imports: [TypeOrmModule.forFeature([TestCaseComment]), TestcaseModule],
  controllers: [TestCaseCommentController],
  providers: [TestCaseCommentService, TestCaseCommentRepository],
  exports: [TestCaseCommentService, TestCaseCommentRepository],
})
export class TestCaseCommentsModule {}
