import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Member } from 'src/member/entities/member.entity';
import { Role } from 'src/role/entities/role.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class RequestComment extends AbstractEntity<RequestComment> {
  @Column()
  memberId: string;

  @ManyToOne(() => Member)
  member: Member;

  @Column()
  requestId: string;

  @Column({ nullable: true })
  roleId: string;

  @ManyToOne(() => Role)
  role?: Role;

  @ManyToOne(() => AssessmentRequest)
  request: AssessmentRequest;

  @Column()
  comment: string;
}
