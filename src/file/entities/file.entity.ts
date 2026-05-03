import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class File extends AbstractEntity<File> {
  @Column()
  name: string;

  @Column()
  path: string;
}
