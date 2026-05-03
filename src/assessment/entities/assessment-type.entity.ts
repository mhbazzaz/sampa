import { AbstractEntity } from 'src/database/abstract.entity';
import { Role } from 'src/role/entities/role.entity';
import { RequestSpecItem } from 'src/spec/entities/request-spec-item.entity';
import { TestcaseGroup } from 'src/test-case/entities/testcase-group.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { AssessmentLayer } from './assessment-layer.entity';

@Entity()
@Index('assessment_type_name', ['name'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class AssessmentType extends AbstractEntity<AssessmentType> {
  @Column()
  name: string;

  @Column({ nullable: true, type: String })
  description: string;

  @ManyToMany(() => Role, (role) => role.leadAssessmentType)
  @JoinTable()
  teamLeadRole?: Role[];

  @ManyToMany(() => Role, (role) => role.memberAssessmentType)
  @JoinTable()
  teamMemberRole?: Role[];

  @OneToMany(
    () => AssessmentLayer,
    (assessmentLayer) => assessmentLayer.assessmentRequest,
  )
  assessmentLayers?: AssessmentLayer[];

  @OneToMany(
    () => TestcaseGroup,
    (testcaseGroup) => testcaseGroup.assessmentType,
  )
  testcaseGroups?: TestcaseGroup[];

  @ManyToMany(
    () => RequestSpecItem,
    (requestSpecItem) => requestSpecItem.assessmentType,
  )
  requestSpecItem?: RequestSpecItem[];
}
