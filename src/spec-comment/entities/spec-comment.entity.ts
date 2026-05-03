import { AbstractEntity } from 'src/database/abstract.entity';
import { Member } from 'src/member/entities/member.entity';
import { Role } from 'src/role/entities/role.entity';
import { RequestSpecContent } from 'src/spec/entities/request-spec-content.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class SpecComment extends AbstractEntity<SpecComment> {
  @Column()
  memberId: string;

  @ManyToOne(() => Member)
  member: Member;

  @Column()
  specId: string;

  @Column()
  roleId: string;

  @ManyToOne(() => Role)
  role?: Role;

  @ManyToOne(() => RequestSpecContent)
  spec: RequestSpecContent;

  @Column()
  comment: string;
}
