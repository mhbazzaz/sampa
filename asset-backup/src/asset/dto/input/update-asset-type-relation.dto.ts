import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { CreateAssetTypeRelationDto } from './create-asset-type-relation.dto';

export class UpdateAssetTypeRelationDto extends PartialType(
  CreateAssetTypeRelationDto,
) {
  @ValidateIf((_, value) => value || value === null)
  parentId?: string;

  @ValidateIf((_, value) => value || value === null)
  childId?: string;

  @ValidateIf((_, value) => value || value === null)
  assetRelationTypeId?: string;
}
