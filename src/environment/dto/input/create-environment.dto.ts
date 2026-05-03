import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CheckEnvironmentExist } from 'src/environment/validators/check-environment-exists.validator';

export class CreateEnvironmentDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  @CheckEnvironmentExist()
  name: string;
}
