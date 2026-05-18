import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FindOneLocationWithFilterDto {
  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  baseline: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  referenceId: string;
}
