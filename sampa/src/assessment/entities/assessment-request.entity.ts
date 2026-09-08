import { AssetToAudit } from 'src/asset/entities/asset-to-audit.entity';
import { RequestFinalStateEnum } from 'src/common/enums/request-final-state.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Environment } from 'src/environment/entities/environment.entity';
import { Member } from 'src/member/entities/member.entity';
import { RequestComment } from 'src/request-comment/entities/request-comment.entity';
import { RequestSpecContent } from 'src/spec/entities/request-spec-content.entity';
import { State } from 'src/states/entities/state.entity';
import { TestcaseContent } from 'src/test-case/entities/testcase-content.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AssessmentLayer } from './assessment-layer.entity';

@Entity()
export class AssessmentRequest extends AbstractEntity<AssessmentRequest> {
  @Column({ unique: true })
  requestNumber: string;

  @Column()
  stateId: string;

  @ManyToOne(() => State)
  state?: State;

  @Column()
  applicantId: string;

  @ManyToOne(() => Member)
  applicant?: Member;

  @Column()
  applicantManagerId: string;

  @ManyToOne(() => Member)
  applicantManager?: Member;

  @Column()
  cisoId: string;

  @Column({
    type: 'enum',
    enum: RequestFinalStateEnum,
    nullable: true,
  })
  finalState: RequestFinalStateEnum;

  @ManyToOne(() => Member)
  ciso?: Member;

  @OneToMany(
    () => AssessmentLayer,
    (assessmentLayer) => assessmentLayer.assessmentRequest,
  )
  assessmentLayers?: AssessmentLayer[];

  @OneToMany(
    () => RequestSpecContent,
    (requestSpecContent) => requestSpecContent.assessmentRequest,
  )
  requestSpecContents?: RequestSpecContent[];

  @OneToMany(
    () => TestcaseContent,
    (testcaseContent) => testcaseContent.assessmentRequest,
  )
  testcaseContents?: TestcaseContent[];

  @Column({ nullable: true })
  assetToAuditBaseline: string;

  @Column()
  environmentId: string;

  @ManyToOne(() => Environment)
  environment?: Environment;

  @ManyToOne(() => AssetToAudit)
  asset?: AssetToAudit;

  @OneToMany(() => RequestComment, (comment) => comment.request)
  requestComments?: RequestComment[];
}
