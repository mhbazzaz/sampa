import { AbstractEntity } from 'src/database/abstract.entity';
import { Member } from 'src/member/entities/member.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { AssessmentLayer } from './assessment-layer.entity';

@Entity()
export class AssessmentTeam extends AbstractEntity<AssessmentTeam> {
  @Column()
  isLead: boolean;

  @Column({ default: false })
  isSAM: boolean;

  @Column()
  isMember: boolean;

  @Column()
  memberId: string;

  @ManyToOne(() => Member)
  member?: Member;

  @Column()
  assessmentLayerId: string;

  @ManyToOne(() => AssessmentLayer)
  assessmentLayer?: AssessmentLayer;
}
