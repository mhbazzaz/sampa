import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { RequestFinalStateEnum } from 'src/common/enums/request-final-state.enum';

export class RequestClosureDto {
  @ApiProperty()
  @IsEnum(RequestFinalStateEnum)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  finalState: RequestFinalStateEnum;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  comment: string;
}
