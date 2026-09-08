import { AssetRelationType } from 'src/asset-relation-type/entities/asset-relation-type.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { AssetTypeVersion } from './asset-type-version.entity';

@Entity()
export class AssetTypeRelation extends AbstractEntity<AssetTypeRelation> {
  @Column()
  parentId: string;

  @ManyToOne(
    () => AssetTypeVersion,
    (assetTypeVersion) => assetTypeVersion.parents,
  )
  parent?: AssetTypeVersion;

  @Column()
  childId: string;

  @ManyToOne(
    () => AssetTypeVersion,
    (assetTypeVersion) => assetTypeVersion.children,
  )
  child?: AssetTypeVersion;

  @Column()
  assetRelationTypeId: string;

  @ManyToOne(() => AssetRelationType)
  assetRelationType?: AssetRelationType;
}
