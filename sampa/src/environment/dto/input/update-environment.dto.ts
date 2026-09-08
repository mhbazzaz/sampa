import { PartialType } from '@nestjs/swagger';
import { Allow, ValidateIf } from 'class-validator';
import { CreateEnvironmentDto } from './create-environment.dto';

export class UpdateEnvironmentDto extends PartialType(CreateEnvironmentDto) {
  @ValidateIf((_, value) => value || value === null)
  name?: string;

  @Allow()
  id?: string;
}
