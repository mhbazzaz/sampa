import { AbstractEntity } from 'src/database/abstract.entity';
import { Member } from 'src/member/entities/member.entity';
import { Role } from 'src/role/entities/role.entity';
import { TestcaseRemediate } from 'src/test-case-remediate/entities/test-case-remediate.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class RemediateComment extends AbstractEntity<RemediateComment> {
  @Column()
  memberId: string;

  @ManyToOne(() => Member)
  member: Member;

  @Column()
  testcaseRemediateId: string;

  @ManyToOne(() => TestcaseRemediate)
  testcaseRemediate: TestcaseRemediate;

  @Column()
  roleId: string;

  @ManyToOne(() => Role)
  role?: Role;

  @Column()
  comment: string;
}
