import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export interface searchBody {
  [name: string]: searchBody | string;
}

export class assetSearchBodyReportExportExcelDto {
  [name: string]: any;

  @Allow()
  tags: string[];

  @ApiProperty()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsOptional()
  assetTypeVersionId?: string;

  @ApiProperty()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  assetTypeId: string;
}
