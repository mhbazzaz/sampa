import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { AssetTypeSortFields } from 'src/common/enums/asset-type-sort.enum';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';

export class FindAllAssetTypeQueryDto extends PaginationDto {
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
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assetCategoryId: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  version: number;

  @ApiPropertyOptional({
    enum: AssetTypeSortFields,
    example: AssetTypeSortFields.CREATED_AT,
  })
  @IsEnum(AssetTypeSortFields)
  @IsOptional()
  orderBy?: AssetTypeSortFields;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], example: 'DESC' })
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  @IsEnum(['ASC', 'DESC'])
  orderDirection?: 'ASC' | 'DESC';
}
