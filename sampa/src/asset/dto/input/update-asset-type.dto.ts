import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { AssetToAudit } from 'src/asset/entities/asset-to-audit.entity';
import { CreateAssetTypeDto } from './create-asset-type.dto';

export class UpdateAssetTypeDto extends PartialType(CreateAssetTypeDto) {
  @ValidateIf((_, value) => value || value === null)
  title?: string;

  @ValidateIf((_, value) => value || value === null)
  assetToAudit?: AssetToAudit[];
}
