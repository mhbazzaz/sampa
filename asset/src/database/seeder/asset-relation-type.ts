import { AssetRelationType } from 'src/asset-relation-type/entities/asset-relation-type.entity';
import {
  RelationDirection,
  RelationDirectionType,
} from 'src/common/enums/relation-direction.enum';
import { DataSource } from 'typeorm';

const assetRelationType: {
  id?: string;
  name: string;
  direction?: RelationDirection;
}[] = [
  {
    id: '12d5453d-7d65-415d-a8e0-335539036df0',
    name: RelationDirectionType.INSTALLED,
    direction: RelationDirection.BIDIRECTIONAL,
  },
  {
    id: 'c6b2ee17-508f-4d96-9116-480d4d8ff0ae',
    name: RelationDirectionType.INCLUDED,
    direction: RelationDirection.BIDIRECTIONAL,
  },
  {
    id: '8b898941-ed8a-4144-82ed-6c835ddb2b50',
    name: RelationDirectionType.CONTAINING,
    direction: RelationDirection.BIDIRECTIONAL,
  },
  {
    id: '5d33e69f-97bf-41d4-8710-6779b14acbb5',
    name: RelationDirectionType.OWNED,
    direction: RelationDirection.BIDIRECTIONAL,
  },
  {
    id: 'b6b87a75-91fe-4094-bb86-d8f5b37a8815',
    name: RelationDirectionType.REGISTERED,
    direction: RelationDirection.BIDIRECTIONAL,
  },
  {
    id: 'eb36467c-0f6a-4bad-aa3a-8d5e21f28986',
    name: RelationDirectionType.RELATED,
    direction: RelationDirection.BIDIRECTIONAL,
  },
  {
    id: 'abcc5d0a-a37e-4b9b-b2bf-457f0fc9d541',
    name: RelationDirectionType.HOSTS,
    direction: RelationDirection.DIRECTIONAL,
  },
  {
    id: '96144568-91da-4b41-b141-2e49df4f78dd',
    name: RelationDirectionType.HAS,
    direction: RelationDirection.DIRECTIONAL,
  },
  {
    id: '279b2b5a-5e2a-40a5-9d2a-1b56bf93406d',
    name: RelationDirectionType.IS_INSTALLED_ON,
    direction: RelationDirection.DIRECTIONAL,
  },
  {
    id: '819066b6-c51c-4923-a978-3b8136659c24',
    name: RelationDirectionType.CONTAINS,
    direction: RelationDirection.DIRECTIONAL,
  },
  {
    id: 'e92f2ac9-2897-4367-bc4b-9a0e62965005',
    name: RelationDirectionType.BELONGS_TO,
    direction: RelationDirection.DIRECTIONAL,
  },
  {
    id: '3b80f869-03e4-4233-9441-20bb46aeeba0',
    name: RelationDirectionType.RUNS,
    direction: RelationDirection.DIRECTIONAL,
  },
];

export const AssetRelationTypeSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < assetRelationType.length; i++) {
    const element = assetRelationType[i];

    const record = await datasource.getRepository(AssetRelationType).findOne({
      where: {
        id: element.id,
        name: element.name,
        direction: element.direction,
      },
    });

    if (record) {
      continue;
    }

    await datasource.getRepository(AssetRelationType).save(element);
  }

  return true;
};
