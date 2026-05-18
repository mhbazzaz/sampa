import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class File extends AbstractEntity<File> {
  @Column({ nullable: true, type: String })
  filePath: string | null;

  @Column({ nullable: true, type: String })
  errorFilePath: string | null;
}
