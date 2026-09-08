import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { DataSource, Repository } from 'typeorm';
import { LayerComment } from '../entities/layer-comment.entity';

@Injectable()
export class LayerCommentRepository extends AbstractRepository<LayerComment> {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(LayerComment)
    private layerCommentRepository: Repository<LayerComment>,
    private i18nService: I18nService,
  ) {
    super(layerCommentRepository, i18nService);
  }
}
