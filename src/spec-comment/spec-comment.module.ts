import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecModule } from 'src/spec/spec.module';
import { SpecCommentController } from './controllers/spec-comment.controller';
import { SpecComment } from './entities/spec-comment.entity';
import { SpecCommentRepository } from './repositories/spec-comment.repository';
import { SpecCommentService } from './services/spec-comment.service';

@Module({
  imports: [TypeOrmModule.forFeature([SpecComment]), SpecModule],
  controllers: [SpecCommentController],
  providers: [SpecCommentService, SpecCommentRepository],
  exports: [SpecCommentService, SpecCommentRepository],
})
export class SpecCommentsModule {}
