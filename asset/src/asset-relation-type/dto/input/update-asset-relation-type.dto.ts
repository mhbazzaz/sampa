import { PartialType } from '@nestjs/swagger';
import { Allow, ValidateIf } from 'class-validator';
import { AssetRelation } from 'src/asset/entities/asset-relation.entity';
import { RelationDirection } from 'src/common/enums/relation-direction.enum';
import { CreateAssetRelationTypeDto } from './create-asset-relation-type.dto';

export class UpdateAssetRelationTypeDto extends PartialType(
  CreateAssetRelationTypeDto,
) {
  @ValidateIf((_, value) => value || value === null)
  name?: string;

  @ValidateIf((_, value) => value || value === null)
  direction?: RelationDirection;

  @ValidateIf((_, value) => value || value === null)
  assetRelations?: AssetRelation[];

  @Allow()
  id?: string;
}
