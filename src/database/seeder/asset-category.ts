import { AssetCategory } from 'src/asset/entities/asset-category.entity';
import { DataSource } from 'typeorm';

const assetCategories: { id: string; name: string }[] = [
  {
    id: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    name: 'Appliance',
  },
  {
    id: 'd1307e1e-52f3-44ae-bc25-e7663bafd4ad',
    name: 'System Software',
  },
  {
    id: '7f579eb8-f716-4299-ad49-76c3e4b88d5d',
    name: 'Network',
  },
  {
    id: '81c6d95f-8cdb-4a1a-8f23-8358957d8149',
    name: 'Application',
  },
];

export const AssetCategorySeeder = async (datasource: DataSource) => {
  for (let i = 0; i < assetCategories.length; i++) {
    const element = assetCategories[i];

    const record = await datasource.getRepository(AssetCategory).findOne({
      where: {
        id: element.id,
        name: element.name,
      },
    });

    if (record) {
      continue;
    }

    await datasource.getRepository(AssetCategory).save(element);
  }

  return true;
};
