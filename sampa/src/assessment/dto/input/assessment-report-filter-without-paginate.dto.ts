import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { StateSideEnum } from 'src/common/enums/state-side.enum';

export class AssessmentReportFilterWithoutPaginateDto {
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

  @ApiPropertyOptional({
    type: [String],
  })
  @Transform(({ value }) => {
    if (!value) return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsOptional()
  assessmentTypeIds?: string[];

  @ApiPropertyOptional({
    type: [String],
  })
  @Transform(({ value }) => {
    if (!value) return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsOptional()
  layerStateIds?: string[];

  @ApiPropertyOptional({
    type: [String],
  })
  @Transform(({ value }) => {
    if (!value) return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsOptional()
  requestStateIds?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === 'true' || value === true,
  )
  @IsOptional()
  isRequestFinalized?: boolean;

  @ApiPropertyOptional({
    enum: StateSideEnum,
  })
  @IsEnum(StateSideEnum, {
    message: i18nValidationMessage('validation.IsEnum'),
  })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  requestSide?: StateSideEnum;

  @ApiPropertyOptional({
    enum: StateSideEnum,
  })
  @IsEnum(StateSideEnum, {
    message: i18nValidationMessage('validation.IsEnum'),
  })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  layerSide?: StateSideEnum;

  applicantIds?: string[];

  @ApiPropertyOptional()
  @IsString({
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsString({
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsOptional()
  managementId?: string;

  @ApiPropertyOptional()
  @IsString({
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional()
  @IsString({
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsOptional()
  departmentId?: string;

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
