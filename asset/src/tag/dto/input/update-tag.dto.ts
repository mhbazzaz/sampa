import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Allow, IsBoolean, IsOptional, ValidateIf } from 'class-validator';
import { CreateTagDto } from './create-tag.dto';

export class UpdateTagDto extends PartialType(CreateTagDto) {
  @ValidateIf((_, value) => value || value === null)
  name?: string;

  @ValidateIf((_, value) => value || value === null)
  assetIds?: string[];

  @ValidateIf((_, value) => value || value === null)
  locationIds?: string[];

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @Allow()
  id?: string;
}
