import { ActionTierEnum } from 'src/common/enums/action-tier.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Process } from 'src/process/entities/process.entity';
import { Role } from 'src/role/entities/role.entity';
import { StateTransition } from 'src/state-transition/entities/state-transition.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity()
export class Action extends AbstractEntity<Action> {
  @Column({ nullable: false, type: String })
  name: string;

  @Column({
    type: 'enum',
    enum: ActionTierEnum,
  })
  tier: ActionTierEnum;

  @Column()
  processId: string;

  @ManyToOne(() => Process)
  process?: Process;

  @OneToMany(() => StateTransition, (stateTransition) => stateTransition.action)
  stateTransitions?: StateTransition[];

  @ManyToMany(() => Role, (role) => role.actions)
  @JoinTable({ name: 'action_role' })
  roles?: Role[];
}
