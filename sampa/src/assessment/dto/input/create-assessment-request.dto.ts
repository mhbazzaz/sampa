import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateAssessmentRequestDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  assetReferenceId: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  environmentId: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  type: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  info: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  assetToAuditBaseline: string;

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
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  assessmentTypeIds: string[];
}
