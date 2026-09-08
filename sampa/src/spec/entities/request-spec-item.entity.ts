import { AssessmentType } from 'src/assessment/entities/assessment-type.entity';
import { AssetType } from 'src/asset/entities/asset-type.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Environment } from 'src/environment/entities/environment.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { RequestSpecContent } from './request-spec-content.entity';
import { RequestSpecGroup } from './request-spec-group.entity';

@Entity()
export class RequestSpecItem extends AbstractEntity<RequestSpecItem> {
  @Column()
  value: string;

  @Column()
  isMultiValue: boolean;

  @Column()
  isOptional: boolean;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  requestSpecGroupId?: string;

  @ManyToOne(() => RequestSpecGroup)
  requestSpecGroup?: RequestSpecGroup;

  @Column({ nullable: true })
  assetTypeId?: string;

  @ManyToOne(() => AssetType)
  assetType?: AssetType;

  @OneToMany(
    () => RequestSpecContent,
    (requestSpecContent) => requestSpecContent.requestSpecItem,
  )
  requestSpecContents?: RequestSpecContent[];

  @ManyToMany(() => Environment, (environment) => environment.requestSpecItems)
  @JoinTable()
  environments?: Environment[];

  @ManyToMany(
    () => AssessmentType,
    (assessmentType) => assessmentType.requestSpecItem,
  )
  @JoinTable()
  assessmentType?: AssessmentType[];

  // Public spec visible to all applicants; Private visible only to Security Dept (INTERNAL roles)
  @Column({ type: 'boolean', default: true })
  isPublic: boolean;

  // Base spec: required before submitting to CISO in initial request page (visible to applicant)
  @Column({ type: 'boolean', default: false })
  isBaseSpec: boolean;
}