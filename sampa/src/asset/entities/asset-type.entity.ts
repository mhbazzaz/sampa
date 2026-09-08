import { AbstractEntity } from 'src/database/abstract.entity';
import { RequestSpecItem } from 'src/spec/entities/request-spec-item.entity';
import { AssetTestCase } from 'src/test-case/entities/asset-test-case.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AssetCategory } from './asset-category.entity';
import { AssetToAudit } from './asset-to-audit.entity';

@Entity()
export class AssetType extends AbstractEntity<AssetType> {
  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @OneToMany(() => AssetToAudit, (assetToAudit) => assetToAudit.assetType)
  assetToAudit?: AssetToAudit[];

  @OneToMany(
    () => RequestSpecItem,
    (RequestSpecItem) => RequestSpecItem.assetType,
  )
  RequestSpecItem?: RequestSpecItem[];

  @Column()
  assetCategoryId: string;

  @ManyToOne(() => AssetCategory)
  assetCategory?: AssetCategory;

  @OneToMany(() => AssetTestCase, (assetTestCase) => assetTestCase.assetType)
  assetTestCases?: AssetTestCase[];
}
