import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Group } from 'src/group/entities/group.entity';
import { Member } from 'src/member/entities/member.entity';

export class CreateGroupMembershipDto {
  @ApiProperty({ type: () => [UserDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDto)
  usersData: UserDto[];

  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  groupId: string;

  @ApiProperty({ type: () => [Group] })
  @IsOptional()
  groups?: Group[];
}
export class UserDto {
  @ApiProperty()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  username: string;

  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IsBoolean') })
  isMember: boolean;

  @ApiProperty()
  @IsBoolean({ message: i18nValidationMessage('validation.IsBoolean') })
  isLead: boolean;

  user: Member;
  userId: string;
}
