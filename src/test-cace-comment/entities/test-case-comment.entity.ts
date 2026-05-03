import { AbstractEntity } from 'src/database/abstract.entity';
import { Member } from 'src/member/entities/member.entity';
import { Role } from 'src/role/entities/role.entity';
import { TestcaseContent } from 'src/test-case/entities/testcase-content.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class TestCaseComment extends AbstractEntity<TestCaseComment> {
  @Column()
  memberId: string;

  @ManyToOne(() => Member)
  member: Member;

  @Column()
  testcaseContentId: string;

  @ManyToOne(() => TestcaseContent)
  testcaseContent: TestcaseContent;

  @Column()
  roleId: string;

  @ManyToOne(() => Role)
  role?: Role;

  @Column()
  comment: string;
}
