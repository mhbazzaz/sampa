import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class GetCartableDto {
  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  requestLastUpdatedAt?: Date;

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  layerLastUpdatedAt?: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  layerLastId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  requestLastId?: string;
}
