import { Action } from 'src/action/entities/action.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { State } from 'src/states/entities/state.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity()
export class Process extends AbstractEntity<Process> {
  @Column()
  name: string;

  @OneToMany(() => Action, (acion) => acion.process)
  acions?: Action[];

  @OneToMany(() => State, (state) => state.process)
  states?: State[];
}
