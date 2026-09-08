import { ActionLog } from 'src/action-log/entities/action-log.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Role } from 'src/role/entities/role.entity';
import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';

@Entity()
export class User extends AbstractEntity<User> {
  @Column({ type: String })
  id: string;

  @Column({ type: Boolean, nullable: true, default: true })
  isEnable: boolean | null;

  @ManyToMany(() => Role, (role) => role.users)
  roles?: Role[];

  @OneToMany(() => ActionLog, (log) => log.user)
  actionLogs?: ActionLog[];
}
