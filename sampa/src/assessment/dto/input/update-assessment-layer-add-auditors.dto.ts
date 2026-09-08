import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateAssessmentLayerAuditorsArrayDto {
  @ApiProperty({ type: String })
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUIDEach') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  layerId?: string;

  @ApiProperty({ type: () => [String] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.IsStringEach'),
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  auditorIds: string[];
}

export class UpdateAssessmentLayerAuditorsDto {
  @ApiProperty({ type: [UpdateAssessmentLayerAuditorsArrayDto] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @ValidateNested({ each: true })
  @Type(() => UpdateAssessmentLayerAuditorsArrayDto)
  dataList: UpdateAssessmentLayerAuditorsArrayDto[];
}
