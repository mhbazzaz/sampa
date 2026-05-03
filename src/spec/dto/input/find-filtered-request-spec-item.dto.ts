import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FindFilteredRequestSpecItemQueryDto {
  @ApiPropertyOptional()
  @IsString({
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsUUID('all', {
    message: i18nValidationMessage('validation.IsUUID'),
  })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  environmentId?: string;

  @ApiPropertyOptional()
  @IsString({
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsUUID('all', {
    message: i18nValidationMessage('validation.IsUUID'),
  })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assetTypeId?: string;

  @ApiPropertyOptional()
  @IsString({
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsUUID('all', {
    message: i18nValidationMessage('validation.IsUUID'),
  })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  requestSpecItemId?: string;

  @ApiPropertyOptional()
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.IsStringEach'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assessmentTypeIds?: string;
}
