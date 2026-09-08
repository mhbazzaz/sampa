import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { LocationTypeCategoryEnum } from 'src/location-type/entities/location-type.entity';

export class FindAllLocationTypeQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage('validation.IsString') })
  @IsOptional()
  name: string;

  @ApiPropertyOptional()
  @IsEnum(LocationTypeCategoryEnum)
  @IsOptional()
  category: LocationTypeCategoryEnum;
}
