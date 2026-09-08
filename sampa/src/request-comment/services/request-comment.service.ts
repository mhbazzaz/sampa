import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
import { DeepPartial, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { RequestComment } from '../entities/request-comment.entity';
import { RequestCommentRepository } from '../repositories/request-comment.repository';

@Injectable()
export class RequestCommentService {
  constructor(
    private readonly requestCommentRepository: RequestCommentRepository,
    private readonly memberRepository: MemberRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(
    data: DeepPartial<RequestComment>,
    member: Member,
  ): Promise<RequestComment> {
    const user = await this.memberRepository.findOne({
      where: { id: member.id },
      relations: { roles: true },
    });

    return this.requestCommentRepository.save({
      requestId: data.requestId,
      memberId: member.id,
      comment: data.comment,
      roleId: user!.roles![0].id,
    });
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<RequestComment>,
  ): Promise<RequestComment | null> {
    return this.requestCommentRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.requestCommentRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<RequestComment>,
    updateRequestComment: Partial<RequestComment>,
  ) {
    return this.requestCommentRepository.update(data, updateRequestComment);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<RequestComment>) {
    return this.requestCommentRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number, requestId: string) {
    return this.requestCommentRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
      where: { requestId },
      relations: { member: true, role: true },
    });
  }
}
