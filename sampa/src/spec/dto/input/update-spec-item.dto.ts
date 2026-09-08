import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { RequestSpecContent } from 'src/spec/entities/request-spec-content.entity';
import { CreateSpecItemDto } from './create-spec-item.dto';

export class UpdateSpecItemDto extends PartialType(CreateSpecItemDto) {
  @ValidateIf((_, value) => value || value === null)
  assetTypeId?: string;

  @ApiProperty({ type: () => [String] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.IsStringEach'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IsNotEmpty') })
  environmentIds: string[];

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

  @ValidateIf((_, value) => value || value === null)
  isPublic?: boolean;

  @ValidateIf((_, value) => value || value === null)
  isBaseSpec?: boolean;
}