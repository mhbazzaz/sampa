import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';

export class FindFilteredTestcaseItemQueryDto extends PaginationDto {
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
  testcaseGroupId?: string;

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
  requestId?: string;

  @ApiPropertyOptional({ type: () => [String] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.IsStringEach'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsOptional()
  assessmentTypeIds: string[];
}
