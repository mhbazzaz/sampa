import { PartialType } from '@nestjs/swagger';
import { Allow, ValidateIf } from 'class-validator';
import { LocationTypeCategoryEnum } from 'src/location-type/entities/location-type.entity';
import { CreateLocationTypeDto } from './create-location-type.dto';

export class UpdateLocationTypeDto extends PartialType(CreateLocationTypeDto) {
  @ValidateIf((_, value) => value || value === null)
  name?: string;

  @ValidateIf((_, value) => value || value === null)
  category?: LocationTypeCategoryEnum;

  @Allow()
  id?: string;
}
