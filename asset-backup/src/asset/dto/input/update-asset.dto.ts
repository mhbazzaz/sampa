import { PartialType } from '@nestjs/swagger';
import { Allow, ValidateIf } from 'class-validator';
import { CreateAssetDto } from './create-asset.dto';

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @ValidateIf((_, value) => value || value === null)
  name?: string;

  @ValidateIf((_, value) => value || value === null)
  content?: object;

  @ValidateIf((_, value) => value || value === null)
  tagIds?: string[];

  @ValidateIf((_, value) => value || value === null)
  relatedAssetIds?: string[];

  @ValidateIf((_, value) => value || value === null)
  accountableId?: string;

  @ValidateIf((_, value) => value || value === null)
  accountableUnitId?: string;

  @ValidateIf((_, value) => value || value === null)
  editorId?: string;

  @ValidateIf((_, value) => value || value === null)
  externalRefId: string;

  @ValidateIf((_, value) => value || value === null)
  editorUnitId: string;

  @ValidateIf((_, value) => value || value === null)
  locationId?: string;

  @ValidateIf((_, value) => value || value === null)
  financialScore?: number;

  @ValidateIf((_, value) => value || value === null)
  reputationScore?: number;

  @ValidateIf((_, value) => value || value === null)
  confidentialityScore?: number;

  @ValidateIf((_, value) => value || value === null)
  integrityScore?: number;

  @ValidateIf((_, value) => value || value === null)
  availabilityScore?: number;

  @Allow()
  id?: string;

  @Allow()
  assetId?: string;
}
