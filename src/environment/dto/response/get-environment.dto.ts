import { ApiProperty } from '@nestjs/swagger';

export class GetEnvironmentDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetEnvironmentDto>) {
    Object.assign(this, partial);
  }
}
