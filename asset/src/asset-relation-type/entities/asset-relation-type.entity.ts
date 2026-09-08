import { AssetTypeRelation } from 'src/asset-type/entities/asset-type-relation.entity';
import { AssetRelation } from 'src/asset/entities/asset-relation.entity';
import { RelationDirection } from 'src/common/enums/relation-direction.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';

@Entity()
@Index('asset_relation_type_name_deletedAt', ['name'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class AssetRelationType extends AbstractEntity<AssetRelationType> {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: RelationDirection,
    default: RelationDirection.BIDIRECTIONAL,
  })
  direction: RelationDirection;

  @OneToMany(
    () => AssetRelation,
    (assetRelation) => assetRelation.assetRelationType,
  )
  assetRelations?: AssetRelation[];

  @OneToMany(
    () => AssetTypeRelation,
    (assetTypeRelation) => assetTypeRelation.assetRelationType,
  )
  assetTypeRelations?: AssetTypeRelation[];
}
