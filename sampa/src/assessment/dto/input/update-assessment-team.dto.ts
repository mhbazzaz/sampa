import { PartialType } from '@nestjs/swagger';
import { CreateAssessmentTeamDto } from './create-assessment-team.dto';

export class UpdateAssessmentTeamDto extends PartialType(
  CreateAssessmentTeamDto,
) {}
