import { AssetVersion } from 'src/asset/entities/asset-version.entity';
import { AssetTypeClassificationEnum } from 'src/common/enums/asset-type-classification.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Filter } from 'src/filter/entities/filter.entity';
import { LocationType } from 'src/location-type/entities/location-type.entity';
import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { AssetTypeRelation } from './asset-type-relation.entity';
import { AssetType } from './asset-type.entity';

@Entity()
export class AssetTypeVersion extends AbstractEntity<AssetTypeVersion> {
  @Column()
  content: string;

  @Column({ default: false })
  archived: boolean;

  @Column({ default: false })
  hasLocation: boolean;

  @Column({ default: 1 })
  version: number;

  @OneToMany(() => AssetTypeRelation, (assetType) => assetType.child)
  parents?: AssetTypeRelation[];

  @OneToMany(() => AssetTypeRelation, (assetType) => assetType.parent)
  children?: AssetTypeRelation[];

  @Column()
  assetTypeId: string;

  @ManyToOne(() => AssetType)
  assetType?: AssetType;

  @Column({
    type: 'enum',
    enum: AssetTypeClassificationEnum,
    default: null,
    nullable: true,
  })
  classification: AssetTypeClassificationEnum;

  @OneToMany(
    () => AssetVersion,
    (assetVersion) => assetVersion.assetTypeVersion,
  )
  assetVersions?: AssetVersion[];

  @ManyToMany(() => Filter, (filter) => filter.assetTypeVersions)
  filters?: Filter[];

  @ManyToMany(
    () => LocationType,
    (locationType) => locationType.assetTypeVersions,
  )
  locationTypes?: LocationType[];
}
