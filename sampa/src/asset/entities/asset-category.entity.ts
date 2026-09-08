import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { AssetType } from './asset-type.entity';

@Entity()
export class AssetCategory extends AbstractEntity<AssetCategory> {
  @Column()
  name: string;

  @OneToMany(() => AssetType, (assetType) => assetType.assetCategory)
  assetTypes?: AssetType[];
}
