import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { RequestSpecItem } from 'src/spec/entities/request-spec-item.entity';
import { CreateSpecGroupDto } from './create-spec-group.dto';

export class UpdateSpecGroupDto extends PartialType(CreateSpecGroupDto) {
  @ValidateIf((_, value) => value || value === null)
  name?: string;

  @ValidateIf((_, value) => value || value === null)
  requestSpecItems?: RequestSpecItem[];
}
