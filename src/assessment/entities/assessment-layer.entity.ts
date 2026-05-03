import { AbstractEntity } from 'src/database/abstract.entity';
import { State } from 'src/states/entities/state.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AssessmentRequest } from './assessment-request.entity';
import { AssessmentTeam } from './assessment-team.entity';
import { AssessmentType } from './assessment-type.entity';

@Entity()
export class AssessmentLayer extends AbstractEntity<AssessmentLayer> {
  @Column()
  stateId: string;

  @ManyToOne(() => State)
  state?: State;

  @Column()
  assessmentRequestId: string;

  @ManyToOne(() => AssessmentRequest)
  assessmentRequest?: AssessmentRequest;

  @Column()
  assessmentTypeId: string;

  @Column({ default: 0 })
  criticalVulnerabilitiesCount: number;

  @Column({ default: 0 })
  highVulnerabilitiesCount: number;

  @Column({ default: 0 })
  mediumVulnerabilitiesCount: number;

  @Column({ default: 0 })
  lowVulnerabilitiesCount: number;

  @ManyToOne(() => AssessmentType)
  assessmentType?: AssessmentType;

  @OneToMany(
    () => AssessmentTeam,
    (assessmentTeam) => assessmentTeam.assessmentLayer,
  )
  assessmentTeams?: AssessmentTeam[];
}
