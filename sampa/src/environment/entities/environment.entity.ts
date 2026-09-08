import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { RequestSpecItem } from 'src/spec/entities/request-spec-item.entity';
import { TestcaseItem } from 'src/test-case/entities/testcase-item.entity';
import { Column, Entity, Index, ManyToMany, OneToMany } from 'typeorm';

@Entity()
@Index('environment_name', ['name'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Environment extends AbstractEntity<Environment> {
  @Column()
  name: string;

  @OneToMany(
    () => AssessmentRequest,
    (assessmentRequest) => assessmentRequest.environment,
  )
  assessmentRequests?: AssessmentRequest[];

  @ManyToMany(
    () => TestcaseItem,
    (assessmentRequest) => assessmentRequest.environments,
  )
  testcaseItems?: TestcaseItem[];

  @ManyToMany(
    () => RequestSpecItem,
    (requestSpecItem) => requestSpecItem.environments,
  )
  requestSpecItems?: RequestSpecItem[];
}
