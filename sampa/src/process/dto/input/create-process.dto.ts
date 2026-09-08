import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateProcessDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  name: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  roleId: string;
}
