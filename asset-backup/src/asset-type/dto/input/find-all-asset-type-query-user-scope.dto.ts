import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { FindAllAssetTypeQueryDto } from './find-all-asset-type-query.dto';

export class FindAllAssetTypeQueryUserScopeDto extends FindAllAssetTypeQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assetTypeId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assetTypeVersionId: string;
}
