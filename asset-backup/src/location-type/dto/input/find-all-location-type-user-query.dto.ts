import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';

export class FindAllLocationTypeUserQueryDto extends PaginationDto {
  @ApiPropertyOptional({ type: () => [String] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsOptional()
  assetTypeVersionIds?: string[];

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  name: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  shouldBeRelatedToAssetTypeVersionId: string;
}
