import { AssetType } from 'src/asset/entities/asset-type.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { TestcaseItem } from './testcase-item.entity';

@Entity()
export class AssetTestCase extends AbstractEntity<AssetTestCase> {
  @Column()
  isEnable: boolean;

  @Column()
  assetTypeId: string;

  @ManyToOne(() => AssetType, (assetType) => assetType.assetTestCases)
  assetType: AssetType;

  @Column()
  testcaseItemId: string;

  @ManyToOne(() => TestcaseItem, (testcaseItem) => testcaseItem.assetTestCases)
  testcaseItem: TestcaseItem;
}
