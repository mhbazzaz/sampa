import { PartialType } from '@nestjs/swagger';
import { Allow, ValidateIf } from 'class-validator';
import { CreateLocationDto } from './create-location.dto';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {
  @ValidateIf((_, value) => value || value === null)
  name?: string;

  @ValidateIf((_, value) => value || value === null)
  code?: string;

  @ValidateIf((_, value) => value || value === null)
  exCode?: string;

  @ValidateIf((_, value) => value || value === null)
  address?: string;

  @ValidateIf((_, value) => value || value === null)
  parentId?: string;

  @ValidateIf((_, value) => value || value === null)
  tagIds?: string[];

  @ValidateIf((_, value) => value || value === null)
  locationTypeId?: string;

  @Allow()
  id?: string;
}
