import { ApiProperty } from '@nestjs/swagger';

export class GetSpecDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetSpecDto>) {
    Object.assign(this, partial);
  }
}
