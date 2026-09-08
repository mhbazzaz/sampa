import { AssessmentLayer } from 'src/assessment/entities/assessment-layer.entity';
import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { ActionLogStatusEnum } from 'src/common/enums/action-log.enum';
import { ActionEnum } from 'src/common/enums/action.enum';
import { EntityTypeEnum } from 'src/common/enums/entity-type.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Member } from 'src/member/entities/member.entity';
import { State } from 'src/states/entities/state.entity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

@Entity()
export class ActionLog extends AbstractEntity<ActionLog> {
  @Column({ type: String, nullable: false })
  userId: string;

  @ManyToOne(() => Member)
  user?: Member;

  @Index()
  @Column({ type: String, nullable: false })
  assessmentRequestId: string;

  @ManyToOne(() => AssessmentRequest)
  assessmentRequest?: AssessmentRequest;

  @Index()
  @Column({ type: String, nullable: true })
  assessmentLayerId: string | null;

  @ManyToOne(() => AssessmentLayer)
  assessmentLayer?: AssessmentLayer;

  @Column({ type: String, nullable: true })
  ipAddress: string | null;

  @Column({
    type: 'text',
    array: true,
  })
  roleIds: string[];

  @Column({
    type: 'enum',
    enum: ActionEnum,
    nullable: true,
  })
  action: ActionEnum | null;

  @Column({ type: String, nullable: true })
  assessmentRequestCurrentStateId: string | null;

  @ManyToOne(() => State)
  assessmentRequestCurrentState?: State;

  @Column({ type: String, nullable: true })
  assessmentRequestNextStateId: string | null;

  @ManyToOne(() => State)
  assessmentRequestNextState?: State;

  @Column({ type: String, nullable: true })
  assessmentLayerCurrentStateId: string | null;

  @ManyToOne(() => State)
  assessmentLayerCurrentState?: State;

  @Column({ type: String, nullable: true })
  assessmentLayerNextStateId: string | null;

  @ManyToOne(() => State)
  assessmentLayerNextState?: State;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  changes?: {
    entityType?: EntityTypeEnum;
    updateData: string;
    oldValue: any;
    newValue: any;
    oldDisplayValue?: any;
    newDisplayValue?: any;
  }[];

  @Column({
    type: 'enum',
    enum: ActionLogStatusEnum,
  })
  status: ActionLogStatusEnum;
}
