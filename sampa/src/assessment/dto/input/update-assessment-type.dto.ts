import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { CreateAssessmentTypeDto } from './create-assessment-type.dto';

export class UpdateAssessmentTypeDto extends PartialType(
  CreateAssessmentTypeDto,
) {
  @ValidateIf((_, value) => value || value === null)
  name: string;

  @ValidateIf((_, value) => value || value === null)
  description: string;
}
