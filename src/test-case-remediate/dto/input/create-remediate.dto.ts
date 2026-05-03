import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TestCaseRemediateApproachEnum } from 'src/common/enums/test-case-remediate-approach.enum';

export class CreateTestcaseRemediateDto {
  @ApiProperty()
  @IsEnum(TestCaseRemediateApproachEnum, {
    message: i18nValidationMessage('validation.IsEnum'),
  })
  @IsOptional({ message: i18nValidationMessage('validation.IsNotEmpty') })
  approach: TestCaseRemediateApproachEnum;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  testcaseContentId: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  reason: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  solution: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  references?: string;

  @ApiProperty()
  @IsDate({ message: i18nValidationMessage('validation.IsDate') })
  @Type(() => Date)
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  dueDate: Date;
}
