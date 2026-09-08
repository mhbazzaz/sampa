import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Group } from 'src/group/entities/group.entity';
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { AssetType } from './asset-type.entity';

@Entity()
@Index('asset_referenceId', ['referenceId'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class AssetToAudit extends AbstractEntity<AssetToAudit> {
  @Column({ type: String })
  title: string;

  @Column()
  referenceId: string;

  @Column()
  assetTypeId: string;

  @ManyToOne(() => AssetType)
  assetType?: AssetType;

  @OneToMany(() => Group, (group) => group.asset)
  group?: Group[];

  @OneToMany(
    () => AssessmentRequest,
    (assessmentRequest) => assessmentRequest.asset,
  )
  assessmentRequests?: AssessmentRequest[];
}
