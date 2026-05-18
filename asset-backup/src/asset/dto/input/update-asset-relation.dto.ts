import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { AssetRelationType } from 'src/asset-relation-type/entities/asset-relation-type.entity';
import { CreateAssetRelationDto } from './create-asset-relation.dto';

export class UpdateAssetRelationDto extends PartialType(
  CreateAssetRelationDto,
) {
  @ValidateIf((_, value) => value || value === null)
  assetRelationTypeId?: string;

  @ValidateIf((_, value) => value || value === null)
  assetRelationType?: AssetRelationType;

  @ValidateIf((_, value) => value || value === null)
  parentId?: string;

  @ValidateIf((_, value) => value || value === null)
  childIds?: string[];
}
