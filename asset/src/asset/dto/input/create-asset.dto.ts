import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { AssetStatusEnum } from 'src/common/enums/asset-status.enum';
import { CheckAssetExternalRefIdExist } from 'src/common/validations/check-asset-external-ref-id-exists.validator copy';

export class CreateAssetDto {
  @ApiProperty()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  assetTypeVersionId: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  name: string;

  @ApiProperty()
  @CheckAssetExternalRefIdExist()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  externalRefId: string;

  @ApiProperty()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  accountableId: string;

  @ApiProperty()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  accountableUnitId: string;

  @ApiProperty()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsOptional()
  editorId: string;

  @ApiProperty()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsOptional()
  editorUnitId: string;

  @IsOptional()
  accountableDeputyId?: string;

  @IsOptional()
  accountableDeputyName?: string;

  @IsOptional()
  accountableManagementId?: string;

  @IsOptional()
  accountableManagementName?: string;

  @IsOptional()
  accountableGroupId?: string;

  @IsOptional()
  accountableGroupName?: string;

  @IsOptional()
  editorDeputyId?: string;

  @IsOptional()
  editorDeputyName?: string;

  @IsOptional()
  editorManagementId?: string;

  @IsOptional()
  editorManagementName?: string;

  @IsOptional()
  editorGroupId?: string;

  @IsOptional()
  editorGroupName?: string;

  @ApiProperty()
  @IsObject({ message: i18nValidationMessage('validation.IsObject') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  content: object;

  @ApiProperty()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsOptional()
  locationId?: string;

  @ApiProperty()
  @IsNumber({}, { message: i18nValidationMessage('validation.IsNumber') })
  @IsOptional()
  financialScore?: number;

  @ApiProperty()
  @IsNumber({}, { message: i18nValidationMessage('validation.IsNumber') })
  @IsOptional()
  reputationScore?: number;

  @ApiProperty()
  @IsNumber({}, { message: i18nValidationMessage('validation.IsNumber') })
  @IsOptional()
  confidentialityScore?: number;

  @ApiProperty()
  @IsNumber({}, { message: i18nValidationMessage('validation.IsNumber') })
  @IsOptional()
  integrityScore?: number;

  @ApiProperty()
  @IsNumber({}, { message: i18nValidationMessage('validation.IsNumber') })
  @IsOptional()
  availabilityScore?: number;

  @ApiProperty({ type: () => [String] })
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
  tagIds?: string[];

  @ApiProperty({ type: () => [String] })
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
  relatedAssetIds?: string[];

  status?: AssetStatusEnum;
}
