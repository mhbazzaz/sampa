import { AssetTypeVersion } from 'src/asset-type/entities/asset-type-version.entity';
import { AbstractEntity } from 'src/database/abstract.entity';
import { Location } from 'src/location/entities/location.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';

export enum LocationTypeCategoryEnum {
  PHYSICAL = 'physical',
  VIRTUAL = 'virtual',
}

@Entity()
export class LocationType extends AbstractEntity<LocationType> {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: LocationTypeCategoryEnum,
    default: LocationTypeCategoryEnum.PHYSICAL,
  })
  category: LocationTypeCategoryEnum;

  @ManyToMany(
    () => AssetTypeVersion,
    (assetTypeVersion) => assetTypeVersion.locationTypes,
  )
  @JoinTable({ name: 'asset_type_version_location_type' })
  assetTypeVersions?: AssetTypeVersion[];

  @OneToMany(() => Location, (location) => location.locationType)
  locations?: Location[];
}
