import { AssetVersion } from 'src/asset/entities/asset-version.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { Filter } from './filter.entity';

@Entity()
export class FilterValue extends AbstractEntity<FilterValue> {
  @Column()
  value: string;

  @ManyToMany(() => AssetVersion, (assetVersion) => assetVersion.filterValues)
  @JoinTable({ name: 'filter_value_asset_version' })
  assetVersions?: AssetVersion[];

  @Column()
  filterId: string;

  @ManyToOne(() => Filter)
  filter?: Filter;
}
