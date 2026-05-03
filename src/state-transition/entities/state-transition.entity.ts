import { Action } from 'src/action/entities/action.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Process } from 'src/process/entities/process.entity';
import { State } from 'src/states/entities/state.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class StateTransition extends AbstractEntity<StateTransition> {
  @Column()
  processId: string;

  @ManyToOne(() => Process)
  process?: Process;

  @Column()
  actionId: string;

  @ManyToOne(() => Action)
  action?: Action;

  @Column()
  currentStateId: string;

  @ManyToOne(() => State, (state) => state.currentStateStateTransition)
  currentState?: State;

  @Column()
  nextStateId: string;

  @ManyToOne(() => State, (state) => state.nextStateStateTransition)
  nextState?: State;
}
