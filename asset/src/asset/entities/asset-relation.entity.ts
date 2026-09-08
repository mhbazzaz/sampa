import { AssetRelationType } from 'src/asset-relation-type/entities/asset-relation-type.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { AssetVersion } from './asset-version.entity';

@Entity()
export class AssetRelation extends AbstractEntity<AssetRelation> {
  @Column()
  assetRelationTypeId: string;

  @ManyToOne(() => AssetRelationType)
  assetRelationType?: AssetRelationType;

  @Column()
  parentId: string;

  @ManyToOne(() => AssetVersion)
  parent?: AssetVersion;

  @Column()
  childId: string;

  @ManyToOne(() => AssetVersion)
  child?: AssetVersion;
}
