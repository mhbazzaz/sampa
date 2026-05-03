import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';

export class CreateMemberDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  id: string;

  @ApiProperty({ type: () => [AssessmentRequest] })
  @IsOptional()
  assessmentRequest?: AssessmentRequest[];
}
