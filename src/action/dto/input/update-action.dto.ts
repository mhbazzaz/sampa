import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { ActionTierEnum } from 'src/common/enums/action-tier.enum';
import { CreateActionDto } from './create-action.dto';

export class UpdateActionDto extends PartialType(CreateActionDto) {
  @ValidateIf((_, value) => value || value === null)
  name?: string;

  @ValidateIf((_, value) => value || value === null)
  tier?: ActionTierEnum;

  @ValidateIf((_, value) => value || value === null)
  action?: string;

  @ValidateIf((_, value) => value || value === null)
  permissionGroupId?: string;
}
