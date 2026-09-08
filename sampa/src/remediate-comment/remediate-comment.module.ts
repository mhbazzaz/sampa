import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestcaseModule } from 'src/test-case/test-case.module';
import { RemediateCommentController } from './controllers/remediate-comment.controller';
import { RemediateComment } from './entities/remediate-comment.entity';
import { RemediateCommentRepository } from './repositories/remediate-comment.repository';
import { RemediateCommentService } from './services/remediate-comment.service';

@Module({
  imports: [TypeOrmModule.forFeature([RemediateComment]), TestcaseModule],
  controllers: [RemediateCommentController],
  providers: [RemediateCommentService, RemediateCommentRepository],
  exports: [RemediateCommentService, RemediateCommentRepository],
})
export class RemediateCommentModule {}
