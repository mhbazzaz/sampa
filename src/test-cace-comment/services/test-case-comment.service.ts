import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
import { TestcaseContentRepository } from 'src/test-case/repositories/test-case-content.repository';
import { DeepPartial, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { TestCaseComment } from '../entities/test-case-comment.entity';
import { TestCaseCommentRepository } from '../repositories/test-case-comment.repository';

@Injectable()
export class TestCaseCommentService {
  constructor(
    private readonly testCaseCommentRepository: TestCaseCommentRepository,
    private readonly testcaseContentRepository: TestcaseContentRepository,
    private readonly memberRepository: MemberRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(
    data: DeepPartial<TestCaseComment>,
    member: Member,
  ): Promise<TestCaseComment> {
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

    const isSupervisor = user!.roles!.some(
      (role) => role.name.split(' ')[1] === 'supervisor',
    );

    if (isSupervisor) {
      const testcaseContent = await this.testcaseContentRepository.findOne({
        where: { id: data.testcaseContentId },
        relations: {
          assessmentRequest: {
            assessmentLayers: {
              assessmentTeams: true,
            },
          },
        },
      });

      if (!testcaseContent?.assessmentRequest) {
        throw new BadRequestException(
          'TestcaseContent is not linked to an AssessmentRequest.',
        );
      }

      const layers = testcaseContent.assessmentRequest.assessmentLayers || [];

      const canComment = layers.some((layer) =>
        layer.assessmentTeams?.some(
          (team) => team.memberId === member.id && team.isLead,
        ),
      );

      if (!canComment) {
        throw new ForbiddenException(
          'Supervisors can only comment on test cases in layers they lead.',
        );
      }
    }

    return this.testCaseCommentRepository.save({
      testcaseContentId: data.testcaseContentId,
      memberId: member.id,
      comment: data.comment,
      roleId,
    });
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<TestCaseComment>,
  ): Promise<TestCaseComment | null> {
    return this.testCaseCommentRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.testCaseCommentRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<TestCaseComment>,
    updateTestCaseComment: Partial<TestCaseComment>,
  ) {
    return this.testCaseCommentRepository.update(data, updateTestCaseComment);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<TestCaseComment>) {
    return this.testCaseCommentRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number, testCaseId: string) {
    return this.testCaseCommentRepository.findAllPagination(skip, take, {
      where: { testcaseContentId: testCaseId },
      order: { createdAt: 'DESC' },
      relations: { member: true, role: true },
    });
  }
}
