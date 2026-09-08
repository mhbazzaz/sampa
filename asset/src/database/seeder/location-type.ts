import {
  LocationType,
  LocationTypeCategoryEnum,
} from 'src/location-type/entities/location-type.entity';
import { DataSource } from 'typeorm';

const locationTypes: {
  id: string;
  name: string;
  category: LocationTypeCategoryEnum;
}[] = [
  {
    id: '2a0c3fae-b9f9-4339-b3db-123244a0a4bd',
    name: 'Main Site',
    category: LocationTypeCategoryEnum.PHYSICAL,
  },
  {
    id: '53bdf7b0-0336-4487-8b4f-4f2108ff33a2',
    name: 'vCenter',
    category: LocationTypeCategoryEnum.VIRTUAL,
  },
  {
    id: 'af47098e-bf56-47fa-9c7d-4bae27ab381d',
    name: 'Data Center',
    category: LocationTypeCategoryEnum.PHYSICAL,
  },
];

export const LocationTypeSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < locationTypes.length; i++) {
    const element = locationTypes[i];

    let locationType = await datasource.getRepository(LocationType).findOne({
      where: [
        {
          name: element.name,
          category: element.category,
        },
        { id: element.id },
      ],
    });

    if (locationType) {
      if (locationType.id !== element.id) {
        console.log(
          `location-type id does not match ${JSON.stringify({
            locationType: locationType.id,
            id: element.id,
            name: element.name,
            category: element.category,
          })}`,
        );
      }
      continue;
    }

    locationType = await datasource.getRepository(LocationType).save(element);
  }

  return true;
};
