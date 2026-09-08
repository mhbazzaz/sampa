import { AssetType } from 'src/asset/entities/asset-type.entity';
import { DataSource } from 'typeorm';

const assetTypes: { id: string; name: string; assetCategoryId: string }[] = [
  {
    id: '89b8ed45-aef6-433f-b663-8db6445542e5',
    name: 'Server',
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
  },
  {
    id: '1659bb45-b730-42a3-83ad-f86f671a2ee5',
    name: 'Operating System',
    assetCategoryId: '81c6d95f-8cdb-4a1a-8f23-8358957d8149',
  },
  {
    id: '1a7d677d-3308-4c03-b5e5-280b8577c12e',
    name: 'Log Source',
    assetCategoryId: '7f579eb8-f716-4299-ad49-76c3e4b88d5d',
  },
  {
    id: '6321f22e-0bac-4925-9326-74d34015159a',
    name: 'Application',
    assetCategoryId: '81c6d95f-8cdb-4a1a-8f23-8358957d8149',
  },
];

export const AssetTypeSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < assetTypes.length; i++) {
    const element = assetTypes[i];

    const record = await datasource.getRepository(AssetType).findOne({
      where: {
        id: element.id,
        name: element.name,
        assetCategoryId: element.assetCategoryId,
      },
    });

    if (record) {
      continue;
    }

    await datasource.getRepository(AssetType).save(element);
  }

  return true;
};
