import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestCommentController } from './controllers/request-comment.controller';
import { RequestComment } from './entities/request-comment.entity';
import { RequestCommentRepository } from './repositories/request-comment.repository';
import { RequestCommentService } from './services/request-comment.service';

@Module({
  imports: [TypeOrmModule.forFeature([RequestComment])],
  controllers: [RequestCommentController],
  providers: [RequestCommentService, RequestCommentRepository],
  exports: [RequestCommentRepository],
})
export class RequestCommentsModule {}
