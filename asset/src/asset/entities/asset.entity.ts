import { ActionLog } from 'src/action-log/entities/action-log.entity';
import { AssetType } from 'src/asset-type/entities/asset-type.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Tag } from 'src/tag/entities/tag.entity';
import {
  Column,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AssetVersion } from './asset-version.entity';

@Entity()
@Index('asset_referenceId_deletedAt', ['referenceId'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Asset extends AbstractEntity<Asset> {
  @Column()
  referenceId: string;

  @Column({ nullable: true, type: String })
  externalRefId: string | null;

  @Column()
  name: string;

  @Column({ nullable: true, type: String })
  description: string | null;

  @OneToMany(() => AssetVersion, (assetVersion) => assetVersion.asset)
  assetVersions?: AssetVersion[];

  @Column()
  assetTypeId: string;

  @ManyToOne(() => AssetType)
  assetType?: AssetType;

  @ManyToMany(() => Tag, (tag) => tag.assets)
  tags?: Tag[];

  @OneToMany(() => ActionLog, (log) => log.asset)
  actionLogs?: ActionLog[];
}
