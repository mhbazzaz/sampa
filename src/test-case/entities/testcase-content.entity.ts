import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { ContentStatus } from 'src/common/enums/test-case-content-status.enum';
import { ContentCriticality } from 'src/common/enums/test-case-criticality.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { TestCaseComment } from 'src/test-cace-comment/entities/test-case-comment.entity';
import { TestcaseRemediate } from 'src/test-case-remediate/entities/test-case-remediate.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { TestcaseItem } from './testcase-item.entity';

@Entity()
export class TestcaseContent extends AbstractEntity<TestcaseContent> {
  @Column()
  observations: string;

  @Column()
  proves: string;

  @Column()
  references: string;

  @Column()
  suggestions: string;

  @Column({
    type: 'enum',
    enum: ContentCriticality,
    nullable: true,
  })
  criticality?: ContentCriticality;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    nullable: true,
  })
  status?: ContentStatus;

  @Column({ nullable: true })
  assessmentRequestId?: string;

  @ManyToOne(() => AssessmentRequest)
  assessmentRequest?: AssessmentRequest;

  @Column({ nullable: true })
  testcaseItemId?: string;

  @ManyToOne(() => TestcaseItem)
  testcaseItem?: TestcaseItem;

  @OneToMany(() => TestCaseComment, (comment) => comment.testcaseContent)
  testCaseComments?: TestCaseComment[];

  @OneToMany(
    () => TestcaseRemediate,
    (testcaseRemediate) => testcaseRemediate.testcaseContent,
  )
  testcaseRemediates?: TestcaseRemediate[];
}
