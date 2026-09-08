import { AssetCategory } from 'src/asset-category/entities/asset-category.entity';
import { Asset } from 'src/asset/entities/asset.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { AssetTypeVersion } from './asset-type-version.entity';

@Entity()
@Index('asset_type_code_deletedAt', ['code'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
@Index('asset_type_name_deletedAt', ['name'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class AssetType extends AbstractEntity<AssetType> {
  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ type: String, nullable: true })
  iconPath?: string | null;

  @Column({ type: 'boolean', default: false })
  isShareable?: boolean;

  @OneToMany(() => Asset, (asset) => asset.assetType)
  assets?: Asset[];

  @OneToMany(
    () => AssetTypeVersion,
    (assetTypeVersion) => assetTypeVersion.assetType,
  )
  assetTypeVersions?: AssetTypeVersion[];

  @Column()
  assetCategoryId: string;

  @ManyToOne(() => AssetCategory)
  assetCategory?: AssetCategory;
}
