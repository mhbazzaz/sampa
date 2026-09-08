import { ApiProperty } from '@nestjs/swagger';

export class GetGroupDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetGroupDto>) {
    Object.assign(this, partial);
  }
}
