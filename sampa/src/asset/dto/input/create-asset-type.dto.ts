import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { AssetToAudit } from 'src/asset/entities/asset-to-audit.entity';

export class CreateAssetTypeDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  title: string;

  @ApiProperty({ type: () => [AssetToAudit] })
  @IsOptional()
  assetToAudit?: AssetToAudit[];
}
