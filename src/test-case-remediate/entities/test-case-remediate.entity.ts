import { TestCaseRemediateApproachEnum } from 'src/common/enums/test-case-remediate-approach.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Member } from 'src/member/entities/member.entity';
import { TestcaseContent } from 'src/test-case/entities/testcase-content.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class TestcaseRemediate extends AbstractEntity<TestcaseRemediate> {
  @Column({
    type: 'enum',
    enum: TestCaseRemediateApproachEnum,
  })
  approach: TestCaseRemediateApproachEnum;

  @Column()
  testcaseContentId: string;

  @ManyToOne(() => TestcaseContent, (content) => content.testcaseRemediates)
  testcaseContent: TestcaseContent;

  @Column({ type: String, nullable: true })
  reason?: string | null;

  @Column({ type: String, nullable: true })
  solution?: string | null;

  @Column({ type: String, nullable: true })
  references: string | null;

  @Column()
  dueDate: Date;

  @Column()
  memberId: string;

  @ManyToOne(() => Member)
  member: Member;
}
