import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CreateFilterDto } from './create-filter.dto';

export class UpdateFilterDto extends PartialType(CreateFilterDto) {
  @ValidateIf((_, value) => value || value === null)
  key?: string;

  @ApiProperty()
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @ValidateNested({ each: true })
  @Type(() => OldValuesDto)
  @IsOptional()
  oldValues?: OldValuesDto[];

  @ApiProperty()
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsOptional()
  values?: string[];
}

export class OldValuesDto {
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  id: string;

  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  value: string;
}
