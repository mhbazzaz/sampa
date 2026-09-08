import { ApiProperty } from '@nestjs/swagger';

export class GetTagDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetTagDto>) {
    Object.assign(this, partial);
  }
}
