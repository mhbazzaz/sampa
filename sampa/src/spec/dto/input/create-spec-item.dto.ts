import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { RequestSpecContent } from 'src/spec/entities/request-spec-content.entity';

export class CreateSpecItemDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  assetTypeId?: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  environmentId?: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  name: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  description: string;

  @ApiProperty()
  @IsObject({ message: i18nValidationMessage('validation.IsObject') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  value: object;

  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IsBoolean') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  isMultiValue: boolean;

  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IsBoolean') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  isOptional: boolean;

  @ApiProperty()
  @IsOptional()
  requestSpecContents?: RequestSpecContent[];

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
  assessmentTypeIds?: string[];

  // Public spec visible to all applicants; Private visible only to Security Dept
  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IsBoolean') })
  @IsOptional()
  isPublic?: boolean;

  // Base spec: required before submitting to CISO (visible to applicant)
  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IsBoolean') })
  @IsOptional()
  isBaseSpec?: boolean;
}