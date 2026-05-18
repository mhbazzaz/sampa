import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CheckLocationCodeExist } from 'src/common/validations/check-location-code-exists.validator';

export class CreateLocationDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  name: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  @CheckLocationCodeExist()
  code: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  exCode: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  address: string;

  @ApiPropertyOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsOptional()
  parentId: string;

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

  @ApiProperty()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  locationTypeId: string;
}
