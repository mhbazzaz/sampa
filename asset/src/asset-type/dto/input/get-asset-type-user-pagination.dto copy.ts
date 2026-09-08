import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';

export class GetAssetTypeUserPaginationDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  name: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  assetTypeId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @Transform(({ value }) => value || undefined)
  @IsOptional()
  categoryId: string;
}
