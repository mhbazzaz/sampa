import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { AssessmentTeam } from 'src/assessment/entities/assessment-team.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { GroupMembership } from 'src/group-membership/entities/group-membership.entity';
import { RemediateComment } from 'src/remediate-comment/entities/remediate-comment.entity';
import { RequestComment } from 'src/request-comment/entities/request-comment.entity';
import { Role } from 'src/role/entities/role.entity';
import { TestCaseComment } from 'src/test-cace-comment/entities/test-case-comment.entity';
import { TestcaseRemediate } from 'src/test-case-remediate/entities/test-case-remediate.entity';
import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';

@Entity()
export class Member extends AbstractEntity<Member> {
  @Column({ type: String, nullable: true })
  firstName: string | null;

  @Column({ type: String, nullable: true })
  lastName: string | null;

  @Column({ type: String, nullable: true })
  username: string | null;

  @Column({ type: Boolean, nullable: true, default: true })
  isEnable: boolean | null;

  @Column({ type: String, nullable: true })
  domain: string | null;

  @OneToMany(() => GroupMembership, (groupMembership) => groupMembership.user)
  groupMembership?: GroupMembership[];

  @OneToMany(
    () => AssessmentRequest,
    (assessmentRequest) => assessmentRequest.applicant,
  )
  applicantRequests?: AssessmentRequest[];

  @OneToMany(
    () => AssessmentRequest,
    (assessmentRequest) => assessmentRequest.applicantManager,
  )
  applicantManagerRequests?: AssessmentRequest[];

  @OneToMany(
    () => AssessmentRequest,
    (assessmentRequest) => assessmentRequest.ciso,
  )
  cisoRequests?: AssessmentRequest[];

  @OneToMany(
    () => AssessmentTeam,
    (assessmentRequest) => assessmentRequest.member,
  )
  assessmentTeam?: AssessmentTeam[];

  @ManyToMany(() => Role, (role) => role.members)
  roles?: Role[];

  @OneToMany(() => TestCaseComment, (comment) => comment.member)
  testCaseComments?: TestCaseComment[];

  @OneToMany(() => RemediateComment, (comment) => comment.member)
  remediateComments?: RemediateComment[];

  @OneToMany(() => RequestComment, (comment) => comment.member)
  requestComments?: RequestComment[];

  @OneToMany(() => TestcaseRemediate, (comment) => comment.member)
  testcaseRemediates?: TestcaseRemediate[];
}
