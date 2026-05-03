import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class PaginationDto {
  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => +value)
  @IsNotEmpty()
  skip: number;

  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => +value)
  @IsNotEmpty()
  take: number;
}
