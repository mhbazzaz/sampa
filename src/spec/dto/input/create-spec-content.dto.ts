import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateSpecContentDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  specItemId: string;

  @ApiProperty()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  assessmentRequestId: string;

  @ApiProperty()
  @IsObject({ message: i18nValidationMessage('validation.IsObject') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  value: any;
}
