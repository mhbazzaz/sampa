import { StateSideEnum } from 'src/common/enums/state-side.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Process } from 'src/process/entities/process.entity';
import { StateTransition } from 'src/state-transition/entities/state-transition.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class State extends AbstractEntity<State> {
  @Column({ type: String })
  name: string;

  @Column({ type: String, nullable: true })
  nameFa: string | null;

  @Column()
  processId: string;

  @ManyToOne(() => Process)
  process?: Process;

  @OneToMany(
    () => StateTransition,
    (stateTransition) => stateTransition.currentState,
  )
  currentStateStateTransition?: StateTransition[];

  @OneToMany(
    () => StateTransition,
    (stateTransition) => stateTransition.nextState,
  )
  nextStateStateTransition?: StateTransition[];

  @Column({ nullable: true, type: Number })
  order: number | null;

  @Column({
    type: 'enum',
    enum: StateSideEnum,
    default: null,
    nullable: true,
  })
  side?: StateSideEnum | null;
}
