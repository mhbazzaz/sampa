import { PartialType } from '@nestjs/swagger';
import { Allow, ValidateIf } from 'class-validator';
import { AssetType } from 'src/asset-type/entities/asset-type.entity';
import { CreateAssetCategoryDto } from './create-asset-category.dto';

export class UpdateAssetCategoryDto extends PartialType(
  CreateAssetCategoryDto,
) {
  @ValidateIf((_, value) => value || value === null)
  name?: string;

  @ValidateIf((_, value) => value || value === null)
  assetTypes?: AssetType[];

  @Allow()
  id?: string;
}
