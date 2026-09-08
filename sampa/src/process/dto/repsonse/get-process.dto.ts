import { ApiProperty } from '@nestjs/swagger';

export class GetProcessDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetProcessDto>) {
    Object.assign(this, partial);
  }
}
