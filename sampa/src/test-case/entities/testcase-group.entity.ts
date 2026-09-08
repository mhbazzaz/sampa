import { AssessmentType } from 'src/assessment/entities/assessment-type.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { TestcaseItem } from './testcase-item.entity';

@Entity()
@Index('testcase_group_name_deletedAt', ['name'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class TestcaseGroup extends AbstractEntity<TestcaseGroup> {
  @Column()
  name: string;

  @Column({ type: String, nullable: true })
  nameFa: string | null;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => TestcaseItem, (testcaseItem) => testcaseItem.testcaseGroup)
  testcaseItems?: TestcaseItem[];

  @Column({ nullable: true })
  assessmentTypeId?: string;

  @ManyToOne(() => AssessmentType)
  assessmentType?: AssessmentType;
}
