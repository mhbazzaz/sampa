import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AssetRetrievalDto {
  @ApiProperty({ type: String })
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUIDEach') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  assetCategoryId?: string;

  @ApiProperty({ type: () => [String], required: false, default: [] })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.IsStringEach'),
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  assetTypeIds?: string[] = [];
}

export class AssetRetrievalArrayDto {
  @ApiProperty({ type: [AssetRetrievalDto] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @ValidateNested({ each: true })
  @Type(() => AssetRetrievalDto)
  dataList: AssetRetrievalDto[];
}
