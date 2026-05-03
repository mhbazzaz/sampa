import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { CreateSpecContentDto } from './create-spec-content.dto';

export class UpdateSpecContentDto extends PartialType(CreateSpecContentDto) {
  @ValidateIf((_, value) => value || value === null)
  specItemId?: string;

  @ValidateIf((_, value) => value || value === null)
  value?: object;
}
