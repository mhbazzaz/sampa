import { Action } from 'src/action/entities/action.entity';
import { AssessmentType } from 'src/assessment/entities/assessment-type.entity';
import { CategoryEnum } from 'src/common/enums/category.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Group } from 'src/group/entities/group.entity';
import { Member } from 'src/member/entities/member.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity()
export class Role extends AbstractEntity<Role> {
  @Column({ type: String, unique: true })
  name: string;

  @Column({ type: String, unique: true })
  nameFa: string;

  @Column({
    type: 'enum',
    enum: CategoryEnum,
    default: CategoryEnum.INTERNAL,
  })
  category: CategoryEnum;

  @Column({ nullable: true })
  superiorId: string | null;

  @ManyToOne(() => Role)
  superior?: Role;

  @OneToMany(() => Role, (stateTransition) => stateTransition.superior)
  childs?: Role[];

  @ManyToMany(() => Group, (group) => group.roles)
  @JoinTable()
  groups?: Group[];

  @ManyToMany(() => Action, (action) => action.roles)
  actions?: Action[];

  @ManyToMany(
    () => AssessmentType,
    (assessmentType) => assessmentType.teamLeadRole,
  )
  leadAssessmentType?: AssessmentType[];

  @ManyToMany(
    () => AssessmentType,
    (assessmentType) => assessmentType.teamMemberRole,
  )
  memberAssessmentType?: AssessmentType[];

  @ManyToMany(() => Member, (member) => member.roles)
  @JoinTable({ name: 'member_role' })
  members?: Member[];
}
