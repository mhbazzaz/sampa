import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
import { RequestSpecContentRepository } from 'src/spec/repositories/request-spec-content.repository';
import { DeepPartial, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { SpecComment } from '../entities/spec-comment.entity';
import { SpecCommentRepository } from '../repositories/spec-comment.repository';

@Injectable()
export class SpecCommentService {
  constructor(
    private readonly specCommentRepository: SpecCommentRepository,
    private readonly requestSpecContentRepository: RequestSpecContentRepository,
    private readonly memberRepository: MemberRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(
    data: DeepPartial<SpecComment>,
    member: Member,
  ): Promise<SpecComment> {
    const user = await this.memberRepository.findOne({
      where: { id: member.id },
      relations: { roles: true },
    });

    let roleId = user!.roles!.find(
      (role) => role.name.split(' ')[1] === 'auditor',
    )?.id;

    if (!roleId) {
      roleId = user!.roles!.find((role) => role.name === 'applicant')?.id;
    }

    if (!roleId) {
      roleId = user!.roles!.find((role) => role.name === 'ciso')?.id;
    }

    const isSupervisor = user!.roles!.some(
      (role) => role.name.split(' ')[1] === 'supervisor',
    );

    if (isSupervisor) {
      const spec = await this.requestSpecContentRepository.findOne({
        where: { id: data.specId },
        relations: {
          assessmentRequest: {
            assessmentLayers: {
              assessmentTeams: true,
            },
          },
        },
      });

      if (!spec?.assessmentRequest) {
        throw new BadRequestException(
          'Spec is not linked to an AssessmentRequest.',
        );
      }

      const layers = spec.assessmentRequest.assessmentLayers || [];

      const canComment = layers.some((layer) =>
        layer.assessmentTeams?.some(
          (team) => team.memberId === member.id && team.isLead,
        ),
      );

      if (!canComment) {
        throw new ForbiddenException(
          'Supervisors can only comment on specs in layers they lead.',
        );
      }
    }

    return this.specCommentRepository.save({
      specId: data.specId,
      memberId: member.id,
      comment: data.comment,
      roleId: roleId,
    });
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<SpecComment>,
  ): Promise<SpecComment | null> {
    return this.specCommentRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.specCommentRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<SpecComment>,
    updateSpecComment: Partial<SpecComment>,
  ) {
    return this.specCommentRepository.update(data, updateSpecComment);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<SpecComment>) {
    return this.specCommentRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number, specId: string) {
    return this.specCommentRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
      where: { specId },
      relations: { member: true, role: true },
    });
  }
}
