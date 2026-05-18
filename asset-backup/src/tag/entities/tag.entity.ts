import { Asset } from 'src/asset/entities/asset.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Location } from 'src/location/entities/location.entity';
import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';

@Entity()
@Index('tag_name_deletedAt', ['name'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Tag extends AbstractEntity<Tag> {
  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Asset, (asset) => asset.tags)
  @JoinTable()
  assets?: Asset[];

  @ManyToMany(() => Location, (location) => location.tags)
  @JoinTable()
  locations?: Location[];

  @Column({ default: true })
  isEnabled: boolean;
}
