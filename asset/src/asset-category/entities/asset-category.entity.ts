import { AssetType } from 'src/asset-type/entities/asset-type.entity';
import { Asset } from 'src/asset/entities/asset.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';

@Entity()
@Index('asset_category_name_deletedAt', ['name'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class AssetCategory extends AbstractEntity<AssetCategory> {
  @Column()
  name: string;

  @OneToMany(() => AssetType, (assetType) => assetType.assetCategory)
  assetTypes?: AssetType[];

  @OneToMany(() => Asset, (asset) => asset.assetType)
  assets?: Asset[];
}
