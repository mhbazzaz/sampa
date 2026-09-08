import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { BindingType } from 'src/common/enums/binding-type.enum';
import { Role } from 'src/role/entities/role.entity';
import { CreateGroupDto } from './create-group.dto';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @ValidateIf((_, value) => value || value === null)
  assetReferenceId?: string;

  @ValidateIf((_, value) => value || value === null)
  applicantManagerId?: string;

  @ValidateIf((_, value) => value || value === null)
  bindingType?: BindingType;

  @ValidateIf((_, value) => value || value === null)
  superiorId?: string;

  @ValidateIf((_, value) => value || value === null)
  roles?: Role[];
}
