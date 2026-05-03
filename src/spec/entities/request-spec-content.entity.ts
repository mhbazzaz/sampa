import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { RequestSpecItem } from './request-spec-item.entity';

@Entity()
export class RequestSpecContent extends AbstractEntity<RequestSpecContent> {
  @Column()
  value: string;

  @Column()
  assessmentRequestId: string;

  @ManyToOne(() => AssessmentRequest)
  assessmentRequest?: AssessmentRequest;

  @Column()
  requestSpecItemId: string;

  @ManyToOne(() => RequestSpecItem)
  requestSpecItem?: RequestSpecItem;
}
