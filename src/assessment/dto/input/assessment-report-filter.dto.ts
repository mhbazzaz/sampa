import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
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
  @IsOptional()
  layerStateIds?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({
    message: i18nValidationMessage('validation.IsString'),
    each: true,
  })
  @IsOptional()
  requestStateIds?: string[];

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assetReferenceId?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  assetTitle?: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assetTypeId?: string;

  @ApiPropertyOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.IsNumber') })
  @Min(0)
  @Transform(({ value }) =>
    value !== undefined && value !== null ? Number(value) : undefined,
  )
  @IsOptional()
  hasCriticalVulnerabilities?: number;

  @ApiPropertyOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.IsNumber') })
  @Min(0)
  @Transform(({ value }) =>
    value !== undefined && value !== null ? Number(value) : undefined,
  )
  @IsOptional()
  hasHighVulnerabilities?: number;

  @ApiPropertyOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.IsNumber') })
  @Min(0)
  @Transform(({ value }) =>
    value !== undefined && value !== null ? Number(value) : undefined,
  )
  @IsOptional()
  hasMediumVulnerabilities?: number;

  @ApiPropertyOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.IsNumber') })
  @Min(0)
  @Transform(({ value }) =>
    value !== undefined && value !== null ? Number(value) : undefined,
  )
  @IsOptional()
  hasLowVulnerabilities?: number;
}
