import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';

export class GetSpecItemDto extends PaginationDto {
  @ApiProperty({ type: () => [String] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsOptional()
  assessmentTypeIds?: string[];

  @ApiProperty()
  @IsString({
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsOptional()
  environmentId?: string;

  @ApiProperty()
  @IsString({
    message: i18nValidationMessage('validation.IsString'),
  })
  @IsOptional()
  assetTypeId?: string;
}
