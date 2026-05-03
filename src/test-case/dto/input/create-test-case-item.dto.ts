import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TestcaseContent } from 'src/test-case/entities/testcase-content.entity';

export class CreateTestcaseItemDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  name: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  nameFa: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  objective?: string | null;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  approach?: string | null;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  methodology?: string | null;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  observationsDefault?: string | null;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  provesDefault?: string | null;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  referencesDefault?: string | null;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  suggestionDefault?: string | null;

  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IsBoolean') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  isMultiValue: boolean;

  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IsBoolean') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  isOptional: boolean;

  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IsBoolean') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  isEnabled: boolean;

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
  environmentIds?: string[];

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  testcaseGroupId?: string;

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
  assetTypeIds?: string[];

  @ApiProperty()
  @IsOptional()
  testcaseContents?: TestcaseContent[];
}
