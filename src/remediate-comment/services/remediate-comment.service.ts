import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';
import { CreateRemediateCommentDto } from '../dto/input/create-remediate-comment.dto';
import { RemediateComment } from '../entities/remediate-comment.entity';
import { RemediateCommentRepository } from '../repositories/remediate-comment.repository';

@Injectable()
export class RemediateCommentService {
  constructor(
    private readonly remediateCommentRepository: RemediateCommentRepository,
    private readonly memberRepository: MemberRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(
    data: CreateRemediateCommentDto,
    member: Member,
  ): Promise<RemediateComment> {
    const user = await this.memberRepository.findOne({
      where: { id: member.id },
      relations: { roles: true },
    });

    let roleId = user!.roles!.find(
      (role) => role.name.split(' ')[1] === 'auditor',
    )?.id;

    if (!roleId) {
      roleId = user!.roles!.find(
        (role) => role.name.split(' ')[1] === 'supervisor',
      )?.id;
    }

    if (!roleId) {
      roleId = user!.roles!.find((role) => role.name === 'applicant')?.id;
    }

    if (!roleId) {
      roleId = user!.roles!.find(
        (role) => role.name === 'applicant manager',
      )?.id;
    }

    if (!roleId) {
      roleId = user!.roles!.find((role) => role.name === 'ciso')?.id;
    }

    return this.remediateCommentRepository.save({
      testcaseRemediateId: data.testcaseRemediateId,
      memberId: member.id,
      comment: data.comment,
      roleId,
    });
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<RemediateComment>,
  ): Promise<RemediateComment | null> {
    return this.remediateCommentRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.remediateCommentRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<RemediateComment>,
    updateRemediateComment: Partial<RemediateComment>,
  ) {
    return this.remediateCommentRepository.update(data, updateRemediateComment);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<RemediateComment>) {
    return this.remediateCommentRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number, remediateId: string) {
    return this.remediateCommentRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
      where: { testcaseRemediateId: remediateId },
      relations: { member: true, role: true },
    });
  }
}
