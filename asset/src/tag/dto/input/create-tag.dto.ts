import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CheckTagNameExist } from 'src/common/validations/check-tag-name-exists.validator';

export class CreateTagDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @CheckTagNameExist()
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  name: string;

  @ApiProperty({ type: () => [String], description: 'Array of Asset IDs' })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsOptional()
  assetIds?: string[];

  @ApiProperty({ type: () => [String], description: 'Array of Location IDs' })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsOptional()
  locationIds?: string[];
}
