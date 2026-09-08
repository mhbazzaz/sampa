import { AssetTypeVersion } from 'src/asset-type/entities/asset-type-version.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { FilterValue } from './filter-value.entity';

@Entity()
//@TODO REMOVE deletedAt
@Index('filter_key_deletedAt', ['key', 'deletedAt'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Filter extends AbstractEntity<Filter> {
  @Column()
  key: string;

  @ManyToMany(() => AssetTypeVersion, (assetType) => assetType.filters)
  @JoinTable()
  assetTypeVersions?: AssetTypeVersion[];

  @OneToMany(() => FilterValue, (filterValue) => filterValue.filter)
  filterValues?: FilterValue[];
}
