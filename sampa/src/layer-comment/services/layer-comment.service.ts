import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Member } from 'src/member/entities/member.entity';
import { DeepPartial, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { LayerComment } from '../entities/layer-comment.entity';
import { LayerCommentRepository } from '../repositories/layer-comment.repository';

@Injectable()
export class LayerCommentService {
  constructor(
    private readonly layerCommentRepository: LayerCommentRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(
    data: DeepPartial<LayerComment>,
    member: Member,
  ): Promise<LayerComment> {
    return this.layerCommentRepository.save({
      layerId: data.layerId,
      memberId: member.id,
      comment: data.comment,
    });
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<LayerComment>,
  ): Promise<LayerComment | null> {
    return this.layerCommentRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.layerCommentRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<LayerComment>,
    updateLayerComment: Partial<LayerComment>,
  ) {
    return this.layerCommentRepository.update(data, updateLayerComment);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<LayerComment>) {
    return this.layerCommentRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number, layerId: string) {
    return this.layerCommentRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
      where: { layerId },
      relations: { member: true, role: true },
    });
  }
}
