import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class GetStateTransitionQueryParamsDto {
  @ApiProperty()
  @IsString({
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsUUID('all', {
    message: i18nValidationMessage('validation.IsUUID'),
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  currentStateId: string;
}
