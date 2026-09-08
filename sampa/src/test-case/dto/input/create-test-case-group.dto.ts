import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CheckTestcaseGroupExist } from 'src/common/validations/check-test-case-group-exists.validator';
import { TestcaseItem } from 'src/test-case/entities/testcase-item.entity';

export class CreateTestcaseGroupDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @CheckTestcaseGroupExist()
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  name: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  nameFa: string;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsOptional()
  testcaseItems?: TestcaseItem[];

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  assessmentTypeId?: string;
}
