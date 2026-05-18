import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Allow, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';

export class FindAllAssetQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  userScopeId?: string;

  @ApiPropertyOptional()
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsOptional()
  supervisorEmployeeIds?: string[];

  @ApiPropertyOptional()
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsOptional()
  assetUserScopeIds?: string[];

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
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assetTypeId?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  locationTypeId?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  shouldBeRelatedToAssetTypeVersionId?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  externalRefId?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  editorId?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  accountableId?: string;

  @ApiPropertyOptional()
  @Allow()
  @IsOptional()
  filters?: string;

  @ApiPropertyOptional()
  @Allow()
  @IsOptional()
  tags?: string;
}
