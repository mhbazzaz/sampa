import { PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { RequestSpecContent } from 'src/spec/entities/request-spec-content.entity';
import { CreateSpecItemDto } from './create-spec-item.dto';

export class UpdateSpecItemDto extends PartialType(CreateSpecItemDto) {
  @ValidateIf((_, value) => value || value === null)
  assetTypeId?: string;

  @ValidateIf((_, value) => value || value === null)
  environmentId?: string;

  @ValidateIf((_, value) => value || value === null)
  value?: object;

  @ValidateIf((_, value) => value || value === null)
  name?: string;

  @ValidateIf((_, value) => value || value === null)
  description?: string;

  @ValidateIf((_, value) => value || value === null)
  isMultiValue?: boolean;

  @ValidateIf((_, value) => value || value === null)
  isOptional?: boolean;

  @ValidateIf((_, value) => value || value === null)
  requestSpecContents?: RequestSpecContent[];

  @ValidateIf((_, value) => value || value === null)
  assessmentTypeIds?: string[];
}
