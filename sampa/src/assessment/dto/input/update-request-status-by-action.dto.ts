import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ActionEnum } from 'src/common/enums/action.enum';

export class UpdateRequestStatusByActionDto {
  @ApiProperty()
  @IsEnum(ActionEnum, {
    message: i18nValidationMessage('validation.IsEnum'),
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  action: ActionEnum;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  comment?: string;
}
