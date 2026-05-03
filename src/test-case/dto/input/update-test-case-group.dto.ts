import { PartialType } from '@nestjs/swagger';
import { Allow, ValidateIf } from 'class-validator';
import { TestcaseItem } from 'src/test-case/entities/testcase-item.entity';
import { CreateTestcaseGroupDto } from './create-test-case-group.dto';

export class UpdateTestcaseGroupDto extends PartialType(
  CreateTestcaseGroupDto,
) {
  @ValidateIf((_, value) => value || value === null)
  name?: string;

  @ValidateIf((_, value) => value || value === null)
  nameFa?: string;

  @ValidateIf((_, value) => value || value === null)
  description?: string;

  @ValidateIf((_, value) => value || value === null)
  testcaseItems?: TestcaseItem[];

  @ValidateIf((_, value) => value || value === null)
  assessmentTypeId?: string;

  @Allow()
  id?: string;
}
