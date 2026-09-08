import { AssetCategory } from 'src/asset-category/entities/asset-category.entity';
import { DataSource } from 'typeorm';

const assetCategories: { id: string; name: string }[] = [
  {
    id: '7f579eb8-f716-4299-ad49-76c3e4b88d5d',
    name: 'Network',
  },
  {
    id: 'd1307e1e-52f3-44ae-bc25-e7663bafd4ad',
    name: 'System Software',
  },
  {
    id: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    name: 'Appliance',
  },
  {
    id: 'e7dca7c3-8d41-4dd6-9236-b9ca2e6cb463',
    name: 'Network Service',
  },
  {
    id: 'fcac4fb0-c280-4d2f-bc51-b6b4a0b39fee',
    name: 'Application',
  },
  {
    id: 'fe89b5b0-c292-4c5d-b9a8-807e65f14bd6',
    name: 'System Service',
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
