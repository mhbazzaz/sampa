import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayerCommentController } from './controllers/layer-comment.controller';
import { LayerComment } from './entities/layer-comment.entity';
import { LayerCommentRepository } from './repositories/layer-comment.repository';
import { LayerCommentService } from './services/layer-comment.service';

@Module({
  imports: [TypeOrmModule.forFeature([LayerComment])],
  controllers: [LayerCommentController],
  providers: [LayerCommentService, LayerCommentRepository],
  exports: [LayerCommentService, LayerCommentRepository],
})
export class LayerCommentsModule {}
