import { Action } from 'src/action/entities/action.entity';
import { CategoryEnum } from 'src/common/enums/category.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity()
@Index('role_name_deletedAt', ['name'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
@Index('role_nameFa_deletedAt', ['nameFa'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Role extends AbstractEntity<Role> {
  @Column()
  name: string;

  @Column()
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

  @ManyToMany(() => Action, (action) => action.roles)
  actions?: Action[];

  @ManyToMany(() => User, (user) => user.roles)
  @JoinTable({ name: 'user_role' })
  users?: User[];
}
