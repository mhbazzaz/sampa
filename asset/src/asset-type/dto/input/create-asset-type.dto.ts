import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Asset } from 'src/asset/entities/asset.entity';
import { AssetTypeClassificationEnum } from 'src/common/enums/asset-type-classification.enum';
import { CheckAssetTypeCodeExist } from 'src/common/validations/check-asset-type-code-exists.validator';
import { CheckAssetTypeNameExist } from 'src/common/validations/check-asset-type-name-exists.validator';

export class CreateAssetTypeDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @CheckAssetTypeCodeExist()
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  code: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @CheckAssetTypeNameExist()
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  name: string;

  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IsBoolean') })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  hasLocation: boolean;

  @ApiProperty()
  @IsObject({ message: i18nValidationMessage('validation.IsObject') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  content: object;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  assetCategoryId: string;

  @ApiPropertyOptional({ type: () => [String] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsOptional()
  locationTypeIds?: string[];

  @ApiPropertyOptional({ type: () => [String] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsOptional()
  assetFilterIds?: string[];

  @ApiProperty({ type: () => [AssetRelationIdsDto] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @ValidateNested({ each: true })
  @Type(() => AssetRelationIdsDto)
  @IsOptional()
  assetRelationIds?: AssetRelationIdsDto[];

  @ApiProperty()
  @IsEnum(AssetTypeClassificationEnum)
  @IsOptional()
  classification?: AssetTypeClassificationEnum;

  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IsBoolean') })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsOptional()
  isShareable?: boolean;

  @ApiProperty({ type: () => [Asset] })
  @IsOptional()
  asset?: Asset[];
}

export class AssetRelationIdsDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  assetTypeVersionId: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  assetRelationTypeId: string;
}
