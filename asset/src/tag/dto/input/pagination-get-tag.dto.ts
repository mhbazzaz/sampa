import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';

export class PaginationGetTagDto extends PaginationDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  isEnabled?: string;
}
