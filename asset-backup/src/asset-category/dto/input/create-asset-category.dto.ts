import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { AssetType } from 'src/asset-type/entities/asset-type.entity';
import { CheckAssetCategoryExist } from 'src/common/validations/check-asset-category-exists.validator';

export class CreateAssetCategoryDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @CheckAssetCategoryExist()
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  name: string;

  @ApiProperty()
  @IsOptional()
  assetTypes?: AssetType[];
}
