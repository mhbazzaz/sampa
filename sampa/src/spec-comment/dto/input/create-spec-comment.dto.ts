import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateSpecCommentDto {
  @ApiProperty({ type: String })
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUIDEach') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  specId: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  comment: string;
}
