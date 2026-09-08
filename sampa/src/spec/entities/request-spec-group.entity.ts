import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { RequestSpecItem } from './request-spec-item.entity';

@Entity()
export class RequestSpecGroup extends AbstractEntity<RequestSpecGroup> {
  @Column()
  name: string;

  @OneToMany(
    () => RequestSpecItem,
    (requestSpecItem) => requestSpecItem.requestSpecGroup,
  )
  requestSpecItems?: RequestSpecItem[];
}
