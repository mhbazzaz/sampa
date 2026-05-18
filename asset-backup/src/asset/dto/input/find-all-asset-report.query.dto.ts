import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class findAllAssetReportQueryDto {
  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  lastCreatedAt?: string;

  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => +value)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  take: number;

  skip = 0;
}
