import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { AssetType } from 'src/asset/entities/asset-type.entity';
import { Group } from 'src/group/entities/group.entity';

export class CreateAssetDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  title: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  baseline?: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  referenceId: string;

  @ApiProperty({ type: () => [AssetType] })
  @IsOptional()
  assetType: AssetType;

  @ApiProperty({ type: () => [Group] })
  @IsOptional()
  groups?: Group[];
}
