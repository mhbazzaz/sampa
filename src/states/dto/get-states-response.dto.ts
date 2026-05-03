import { ApiProperty } from '@nestjs/swagger';

export class GetStatesDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetStatesDto>) {
    Object.assign(this, partial);
  }
}
