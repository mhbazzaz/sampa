import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { CreateProcessDto } from './create-process.dto';

export class UpdateProcessDto extends PartialType(CreateProcessDto) {
  @ValidateIf((_, value) => value || value === null)
  name?: string;

  @ValidateIf((_, value) => value || value === null)
  roleId?: string;
}
