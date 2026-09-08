import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { CreateMemberDto } from './create-member.dto';

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  @ValidateIf((_, value) => value || value === null)
  userId?: string;

  @ValidateIf((_, value) => value || value === null)
  assessmentRequest?: AssessmentRequest[];
}
