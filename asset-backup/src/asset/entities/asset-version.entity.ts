import { AssetTypeVersion } from 'src/asset-type/entities/asset-type-version.entity';
import { AssetStatusEnum } from 'src/common/enums/asset-status.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { FilterValue } from 'src/filter/entities/filter-value.entity';
import { Location } from 'src/location/entities/location.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AssetRelation } from './asset-relation.entity';
import { Asset } from './asset.entity';

@Entity()
@Index(
  'asset_baseline_version_deletedAt',
  ['baseline', 'version', 'deletedAt'],
  {
    unique: true,
    where: '"deletedAt" IS NULL',
  },
)
export class AssetVersion extends AbstractEntity<AssetVersion> {
  @Column({ default: 1 })
  version: number;

  @Column()
  baseline: string;

  @Column()
  content: string;

  @Column({
    type: 'enum',
    enum: AssetStatusEnum,
    default: AssetStatusEnum.InService,
  })
  status: AssetStatusEnum;

  @Column({ nullable: true, type: 'uuid' })
  updateUserId: string | null;

  @ManyToOne(() => User)
  updateUser?: User;

  @Column({ nullable: true, type: 'uuid' })
  accountableUnitId: string | null;

  @ManyToOne(() => User)
  accountable?: User;

  @Column({ nullable: true, type: 'uuid' })
  accountableId: string | null;

  @ManyToOne(() => User)
  editor?: User;

  @Column({ nullable: true, type: 'uuid' })
  editorId: string | null;

  @Column({ nullable: true, type: 'uuid' })
  editorUnitId: string | null;

  @Column({ default: false })
  archived: boolean;

  @Column({ type: String })
  assetTypeVersionId: string;

  @ManyToOne(() => AssetTypeVersion)
  assetTypeVersion?: AssetTypeVersion;

  @Column({ type: String, nullable: true })
  assetId: string | null;

  @ManyToOne(() => Asset)
  asset?: Asset;

  @OneToMany(() => AssetRelation, (asset) => asset.parent)
  parents?: AssetRelation[];

  @OneToMany(() => AssetRelation, (asset) => asset.child)
  children?: AssetRelation[];

  @ManyToMany(() => FilterValue, (filterValue) => filterValue.assetVersions)
  filterValues?: FilterValue[];

  @Column({ type: String, nullable: true })
  locationId: string | null;

  @ManyToOne(() => Location)
  location?: Location;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  financialScore: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  reputationScore: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  confidentialityScore: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  integrityScore: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  availabilityScore: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  evaluationScore: number;
}
