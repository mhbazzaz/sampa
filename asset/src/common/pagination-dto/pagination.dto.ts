import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class PaginationDto {
  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => +value)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  skip: number;

  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => +value)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  take: number;
}
