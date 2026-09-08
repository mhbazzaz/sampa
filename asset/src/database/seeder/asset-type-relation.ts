import { AssetRelationType } from 'src/asset-relation-type/entities/asset-relation-type.entity';
import { AssetTypeRelation } from 'src/asset-type/entities/asset-type-relation.entity';
import { AssetTypeVersion } from 'src/asset-type/entities/asset-type-version.entity';
import { RelationDirectionType } from 'src/common/enums/relation-direction.enum';
import { DataSource } from 'typeorm';

const assetTypeRelations: {
  assetRelationType: string;
  parent: { name: string; version: number };
  child: { name: string; version: number };
}[] = [
  // Operating System
  {
    assetRelationType: RelationDirectionType.INSTALLED,
    parent: { name: 'Operating System', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.INSTALLED,
    parent: { name: 'Operating System', version: 1 },
    child: { name: 'VM', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HAS,
    parent: { name: 'Operating System', version: 1 },
    child: { name: 'Active Directory', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HAS,
    parent: { name: 'Operating System', version: 1 },
    child: { name: 'Database', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HAS,
    parent: { name: 'Operating System', version: 1 },
    child: { name: 'DHCP', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HAS,
    parent: { name: 'Operating System', version: 1 },
    child: { name: 'DNS', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HAS,
    parent: { name: 'Operating System', version: 1 },
    child: { name: 'FTP Service', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HAS,
    parent: { name: 'Operating System', version: 1 },
    child: { name: 'Update Service', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HAS,
    parent: { name: 'Operating System', version: 1 },
    child: { name: 'Client', version: 1 },
  },
  // Hypervisor
  {
    assetRelationType: RelationDirectionType.INSTALLED,
    parent: { name: 'Hypervisor', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  // VM
  {
    assetRelationType: RelationDirectionType.CONTAINING,
    parent: { name: 'VM', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.INSTALLED,
    parent: { name: 'VM', version: 1 },
    child: { name: 'Operating System', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.INCLUDED,
    parent: { name: 'VM', version: 1 },
    child: { name: 'Cluster', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'VM', version: 1 },
    child: { name: 'Active Directory', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.CONTAINS,
    parent: { name: 'VM', version: 1 },
    child: { name: 'Backup Device', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'VM', version: 1 },
    child: { name: 'Database', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'VM', version: 1 },
    child: { name: 'DHCP', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'VM', version: 1 },
    child: { name: 'DNS', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'VM', version: 1 },
    child: { name: 'FTP Service', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'VM', version: 1 },
    child: { name: 'Update Service', version: 1 },
  },
  // Mainframe CPU
  {
    assetRelationType: RelationDirectionType.BELONGS_TO,
    parent: { name: 'Mainframe CPU', version: 1 },
    child: { name: 'Mainframe Storage', version: 1 },
  },
  // Mainframe Storage
  {
    assetRelationType: RelationDirectionType.HAS,
    parent: { name: 'Mainframe Storage', version: 1 },
    child: { name: 'Database', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.CONTAINS,
    parent: { name: 'Mainframe Storage', version: 1 },
    child: { name: 'Mainframe CPU', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.CONTAINS,
    parent: { name: 'Mainframe Storage', version: 1 },
    child: { name: 'Backup Device', version: 1 },
  },
  // Server
  {
    assetRelationType: RelationDirectionType.CONTAINING,
    parent: { name: 'Server', version: 1 },
    child: { name: 'VM', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.IS_INSTALLED_ON,
    parent: { name: 'Server', version: 1 },
    child: { name: 'Storage', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'Server', version: 1 },
    child: { name: 'Active Directory', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.CONTAINS,
    parent: { name: 'Server', version: 1 },
    child: { name: 'Backup Device', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'Server', version: 1 },
    child: { name: 'Database', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'Server', version: 1 },
    child: { name: 'DHCP', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'Server', version: 1 },
    child: { name: 'DNS', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'Server', version: 1 },
    child: { name: 'FTP Service', version: 1 },
  },
  // Storage
  {
    assetRelationType: RelationDirectionType.CONTAINS,
    parent: { name: 'Storage', version: 1 },
    child: { name: 'Backup Device', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HAS,
    parent: { name: 'Storage', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  // Cluster
  {
    assetRelationType: RelationDirectionType.INCLUDED,
    parent: { name: 'Cluster', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.INCLUDED,
    parent: { name: 'Cluster', version: 1 },
    child: { name: 'VM', version: 1 },
  },
  // Active Directory
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'Active Directory', version: 1 },
    child: { name: 'Container', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.IS_INSTALLED_ON,
    parent: { name: 'Active Directory', version: 1 },
    child: { name: 'Operating System', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'Active Directory', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'Active Directory', version: 1 },
    child: { name: 'VM', version: 1 },
  },
  // Backup Device
  {
    assetRelationType: RelationDirectionType.BELONGS_TO,
    parent: { name: 'Backup Device', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.BELONGS_TO,
    parent: { name: 'Backup Device', version: 1 },
    child: { name: 'Container', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.BELONGS_TO,
    parent: { name: 'Backup Device', version: 1 },
    child: { name: 'VM', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.BELONGS_TO,
    parent: { name: 'Backup Device', version: 1 },
    child: { name: 'Mainframe Storage', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.BELONGS_TO,
    parent: { name: 'Backup Device', version: 1 },
    child: { name: 'Storage', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.BELONGS_TO,
    parent: { name: 'Backup Device', version: 1 },
    child: { name: 'Database', version: 1 },
  },
  //Container
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'Container', version: 1 },
    child: { name: 'Active Directory', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.CONTAINS,
    parent: { name: 'Container', version: 1 },
    child: { name: 'Backup Device', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'Container', version: 1 },
    child: { name: 'Database', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'Container', version: 1 },
    child: { name: 'DHCP', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'Container', version: 1 },
    child: { name: 'Update Service', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'Container', version: 1 },
    child: { name: 'DNS', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.RUNS,
    parent: { name: 'Container', version: 1 },
    child: { name: 'FTP Service', version: 1 },
  },
  //Database
  {
    assetRelationType: RelationDirectionType.CONTAINS,
    parent: { name: 'Database', version: 1 },
    child: { name: 'Backup Device', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.IS_INSTALLED_ON,
    parent: { name: 'Database', version: 1 },
    child: { name: 'Mainframe Storage', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'Database', version: 1 },
    child: { name: 'Container', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'Database', version: 1 },
    child: { name: 'VM', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.IS_INSTALLED_ON,
    parent: { name: 'Database', version: 1 },
    child: { name: 'Operating System', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'Database', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  //DHCP
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'DHCP', version: 1 },
    child: { name: 'Container', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'DHCP', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'DHCP', version: 1 },
    child: { name: 'VM', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.IS_INSTALLED_ON,
    parent: { name: 'DHCP', version: 1 },
    child: { name: 'Operating System', version: 1 },
  },
  //DNS
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'DNS', version: 1 },
    child: { name: 'Container', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'DNS', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'DNS', version: 1 },
    child: { name: 'VM', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.IS_INSTALLED_ON,
    parent: { name: 'DNS', version: 1 },
    child: { name: 'Operating System', version: 1 },
  },
  //FTP Service
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'FTP Service', version: 1 },
    child: { name: 'Container', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'FTP Service', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'FTP Service', version: 1 },
    child: { name: 'VM', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.IS_INSTALLED_ON,
    parent: { name: 'FTP Service', version: 1 },
    child: { name: 'Operating System', version: 1 },
  },
  //Update Service
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'Update Service', version: 1 },
    child: { name: 'Container', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'Update Service', version: 1 },
    child: { name: 'Server', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.HOSTS,
    parent: { name: 'Update Service', version: 1 },
    child: { name: 'VM', version: 1 },
  },
  {
    assetRelationType: RelationDirectionType.IS_INSTALLED_ON,
    parent: { name: 'Update Service', version: 1 },
    child: { name: 'Operating System', version: 1 },
  },
  //Client
  {
    assetRelationType: RelationDirectionType.IS_INSTALLED_ON,
    parent: { name: 'Client', version: 1 },
    child: { name: 'Operating System', version: 1 },
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
