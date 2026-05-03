import { AbstractEntity } from 'src/database/abstract.entity';
import { Environment } from 'src/environment/entities/environment.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AssetTestCase } from './asset-test-case.entity';
import { TestcaseContent } from './testcase-content.entity';
import { TestcaseGroup } from './testcase-group.entity';

@Entity()
@Index('testcase_item_name_deletedAt', ['name'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class TestcaseItem extends AbstractEntity<TestcaseItem> {
  @Column()
  name: string;

  @Column({ nullable: true, type: String })
  nameFa: string | null;

  @Column({ nullable: true, type: String })
  objective?: string | null;

  @Column({ nullable: true, type: String })
  approach?: string | null;

  @Column({ nullable: true, type: String })
  methodology?: string | null;

  @Column({ nullable: true, type: String })
  observationsDefault?: string | null;

  @Column({ nullable: true, type: String })
  provesDefault?: string | null;

  @Column({ nullable: true, type: String })
  referencesDefault?: string | null;

  @Column({ nullable: true, type: String })
  suggestionDefault?: string | null;

  @Column()
  isMultiValue: boolean;

  @Column()
  isOptional: boolean;

  @Column()
  isEnabled: boolean;

  @OneToMany(
    () => TestcaseContent,
    (testcaseContent) => testcaseContent.testcaseItem,
  )
  testcaseContents?: TestcaseContent[];

  @Column({ nullable: true })
  testcaseGroupId?: string;

  @ManyToOne(() => TestcaseGroup)
  testcaseGroup?: TestcaseGroup;

  @ManyToMany(
    () => Environment,
    (environment) => environment.assessmentRequests,
  )
  @JoinTable()
  environments?: Environment[];

  @OneToMany(() => AssetTestCase, (assetTestCase) => assetTestCase.testcaseItem)
  assetTestCases?: AssetTestCase[];
}
