import { AssetVersion } from 'src/asset/entities/asset-version.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { LocationType } from 'src/location-type/entities/location-type.entity';
import { Tag } from 'src/tag/entities/tag.entity';
import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class Location extends AbstractEntity<Location> {
  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ type: String, nullable: true })
  exCode: string | null;

  @Column()
  address: string;

  @Column({ type: String, nullable: true })
  parentId: string | null;

  @ManyToOne(() => Location)
  parent?: Location;

  @ManyToMany(() => Tag, (tag) => tag.locations)
  tags?: Tag[];

  @Column({ type: String })
  locationTypeId: string;

  @ManyToOne(() => LocationType)
  locationType?: LocationType;

  @OneToMany(() => AssetVersion, (assetVersion) => assetVersion.location)
  assetVersions?: AssetVersion[];

  @OneToMany(() => Location, (location) => location.parent)
  children?: Location[];
}
