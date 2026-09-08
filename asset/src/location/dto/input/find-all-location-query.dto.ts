import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';

export class FindAllLocationQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  name: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  code: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  exCode: string;

  @ApiPropertyOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsOptional()
  parentId: string;

  @ApiPropertyOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IsUUID') })
  @IsOptional()
  locationTypeId: string;

  @ApiPropertyOptional({ type: () => [String] })
  @IsArray({ message: i18nValidationMessage('validation.IsArray') })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IsUUIDEach'),
  })
  @IsOptional()
  tagIds: string[];
}
