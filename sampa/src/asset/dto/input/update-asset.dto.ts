import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { AssetType } from 'src/asset/entities/asset-type.entity';
import { Group } from 'src/group/entities/group.entity';
import { CreateAssetDto } from './create-asset.dto';

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @ValidateIf((_, value) => value || value === null)
  title?: string;

  @ValidateIf((_, value) => value || value === null)
  baseline?: string;

  @ValidateIf((_, value) => value || value === null)
  referenceId?: string;

  @ValidateIf((_, value) => value || value === null)
  assetType?: AssetType;

  @ValidateIf((_, value) => value || value === null)
  groups?: Group[];
}
