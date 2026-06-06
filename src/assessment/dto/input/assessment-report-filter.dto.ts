import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';

export class AssessmentReportFilterDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  startTimeFrom?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  startTimeTo?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  lastActTimeFrom?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  lastActTimeTo?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({
    message: i18nValidationMessage('validation.IsString'),
    each: true,
  })
  layerStatuses?: string[];

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assetReferenceId?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  assetTitle?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assetTypeId?: string;
}
