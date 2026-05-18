import { AssetRelationType } from 'src/asset-relation-type/entities/asset-relation-type.entity';
import { AssetTypeRelation } from 'src/asset-type/entities/asset-type-relation.entity';
import { AssetTypeVersion } from 'src/asset-type/entities/asset-type-version.entity';
import { DataSource } from 'typeorm';

const assetTypeRelations: {
  assetRelationType: string;
  parent: { name: string; version: number };
  child: { name: string; version: number };
}[] = [
  {
    assetRelationType: 'related',
    parent: { name: 'Mainframe Storage', version: 1 },
    child: { name: 'Mainframe CPU', version: 1 },
  },
  {
    assetRelationType: 'installed',
    parent: { name: 'Hypervisor', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  {
    assetRelationType: 'containing',
    parent: { name: 'Server', version: 1 },
    child: { name: 'VM', version: 1 },
  },
  {
    assetRelationType: 'related',
    parent: { name: 'Server', version: 1 },
    child: { name: 'Storage', version: 1 },
  },
  {
    assetRelationType: 'included',
    parent: { name: 'Cluster', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  {
    assetRelationType: 'installed',
    parent: { name: 'Operating System', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  {
    assetRelationType: 'registered',
    parent: { name: 'Cluster', version: 1 },
    child: { name: 'VM', version: 1 },
  },
  {
    assetRelationType: 'installed',
    parent: { name: 'Operating System', version: 1 },
    child: { name: 'VM', version: 1 },
  },
];

export const AssetTypeRelationSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < assetTypeRelations.length; i++) {
    const element = assetTypeRelations[i];

    const record = await datasource.getRepository(AssetTypeRelation).findOne({
      where: {
        assetRelationType: { name: element.assetRelationType },
        parent: {
          assetType: { name: element.parent.name },
          version: element.parent.version,
        },
        child: {
          assetType: { name: element.child.name },
          version: element.child.version,
        },
      },
    });

    if (record) {
      continue;
    }

    try {
      const parent = await datasource.getRepository(AssetTypeVersion).findOne({
        where: {
          assetType: { name: element.parent.name },
          version: element.parent.version,
        },
      });

      if (!parent) {
        console.log('AssetTypeRelation parent not find', {
          assetType: { name: element.parent.name },
          version: element.parent.version,
        });
        continue;
      }
      const child = await datasource.getRepository(AssetTypeVersion).findOne({
        where: {
          assetType: { name: element.child.name },
          version: element.child.version,
        },
      });

      if (!child) {
        console.log('AssetTypeRelation child not find', {
          assetType: { name: element.child.name },
          version: element.child.version,
        });
        continue;
      }
      const assetRelationType = await datasource
        .getRepository(AssetRelationType)
        .findOne({
          where: {
            name: element.assetRelationType,
          },
        });

      if (!assetRelationType) {
        console.log('AssetRelationType assetRelationType not find', {
          name: element.assetRelationType,
        });
        continue;
      }

      await datasource.getRepository(AssetTypeRelation).save({
        assetRelationTypeId: assetRelationType.id,
        parentId: parent.id,
        childId: child.id,
      });
    } catch (error) {
      console.log('create AssetTypeRelation error', element, error);
    }
  }

  return true;
};
