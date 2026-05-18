import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';

export class FindAllLocationUserQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  name: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  code: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  exCode: string;

  @ApiPropertyOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsOptional()
  parentId: string;

  @ApiPropertyOptional({ type: () => [String] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsOptional()
  locationTypeIds: string[];

  @ApiPropertyOptional({ type: () => [String] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsOptional()
  tagIds: string[];

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  shouldBeRelatedToAssetTypeVersionId: string;
}
