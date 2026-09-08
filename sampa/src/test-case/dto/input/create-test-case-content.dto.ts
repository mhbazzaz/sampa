import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ContentStatus } from 'src/common/enums/test-case-content-status.enum';
import { ContentCriticality } from 'src/common/enums/test-case-criticality.enum';

export class CreateTestcaseContentDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  observations?: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  proves: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  references?: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  suggestions?: string;

  @ApiProperty()
  @IsEnum(ContentCriticality, {
    message: i18nValidationMessage('validation.IsEnum'),
  })
  @IsOptional()
  criticality?: ContentCriticality;

  @ApiProperty()
  @IsEnum(ContentStatus, {
    message: i18nValidationMessage('validation.IsEnum'),
  })
  @IsOptional()
  status: ContentStatus;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  assessmentRequestId?: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  testcaseItemId?: string;
}
