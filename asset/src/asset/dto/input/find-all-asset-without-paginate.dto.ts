import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Allow, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FindAllAssetQueryWithOutPaginateDto {
  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assetTypeVersionId?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assetCategoryId?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  externalRefId?: string;

  @ApiPropertyOptional()
  @Allow()
  @IsOptional()
  filters?: string;

  @ApiPropertyOptional()
  @Allow()
  @IsOptional()
  tags?: string;
}
