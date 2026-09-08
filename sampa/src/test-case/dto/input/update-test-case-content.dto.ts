import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsEnum, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ContentStatus } from 'src/common/enums/test-case-content-status.enum';
import { ContentCriticality } from 'src/common/enums/test-case-criticality.enum';

export class UpdateTestcaseContentDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  observations?: string | null;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  proves?: string | null;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  references?: string | null;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  suggestions?: string | null;

  @ApiProperty()
  @IsEnum(ContentCriticality)
  @IsOptional()
  criticality?: ContentCriticality;

  @ApiProperty()
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  assessmentRequestId?: string | null;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  testcaseItemId?: string | null;

  @Allow()
  id?: string;
}
