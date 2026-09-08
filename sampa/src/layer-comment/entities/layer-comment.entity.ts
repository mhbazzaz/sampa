import { AssessmentLayer } from 'src/assessment/entities/assessment-layer.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Member } from 'src/member/entities/member.entity';
import { Role } from 'src/role/entities/role.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class LayerComment extends AbstractEntity<LayerComment> {
  @Column()
  memberId: string;

  @ManyToOne(() => Member)
  member: Member;

  @Column()
  layerId: string;

  @ManyToOne(() => AssessmentLayer)
  layer: AssessmentLayer;

  @Column()
  comment: string;

  @Column({ nullable: true })
  roleId: string;

  @ManyToOne(() => Role)
  role?: Role;
}
