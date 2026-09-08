import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import {
  CreateGroupMembershipDto,
  UserDto,
} from './create-group-membership.dto';

export class UpdateGroupMembershipDto extends PartialType(
  CreateGroupMembershipDto,
) {
  @ValidateIf((_, value) => value || value === null)
  usersData?: UserDto[];

  @ValidateIf((_, value) => value || value === null)
  groupId?: string;
}
