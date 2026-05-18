import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Asset } from 'src/asset/entities/asset.entity';
import { AssetRelationIdsDto } from './create-asset-type.dto';

export class UpdateAssetTypeDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  code?: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsObject({ message: i18nValidationMessage('validation.IsObject') })
  @IsOptional()
  content?: object;

  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IsBoolean') })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsOptional()
  hasLocation?: boolean;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  assetCategoryId?: string;

  @ApiProperty()
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
  locationTypeIds?: string[];

  @ApiProperty()
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
  assetFilterIds?: string[];

  @ApiProperty({ type: () => [Asset] })
  @IsOptional()
  asset?: Asset[];

  @ApiProperty({ type: () => [AssetRelationIdsDto] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @ValidateNested({ each: true })
  @Type(() => AssetRelationIdsDto)
  @IsOptional()
  assetRelationIds?: AssetRelationIdsDto[];

  @Allow()
  id?: string;
}
