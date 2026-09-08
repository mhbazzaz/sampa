import { EntityTypeEnum } from 'src/common/enums/entity-type.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('pending_changes')
export class PendingChange extends AbstractEntity<PendingChange> {
  @Index()
  @Column({ type: 'uuid', nullable: false })
  assessmentRequestId: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assessmentLayerId: string | null;

  @Column({ type: 'enum', enum: EntityTypeEnum, nullable: false })
  entityType: EntityTypeEnum;

  @Column({ type: 'jsonb', nullable: false })
  beforeEntity: any;

  @Column({ type: 'jsonb', nullable: false })
  updateDto: any;

  @Column({ type: 'varchar', nullable: false })
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', nullable: true })
  assessmentRequestCurrentStateId: string | null;

  @Column({ type: 'varchar', nullable: true })
  assessmentRequestNextStateId: string | null;

  @Column({ type: 'varchar', nullable: true })
  assessmentLayerCurrentStateId: string | null;

  @Column({ type: 'varchar', nullable: true })
  assessmentLayerNextStateId: string | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  isFlushed: boolean;
}
