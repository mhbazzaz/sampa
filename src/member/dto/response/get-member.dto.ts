import { ApiProperty } from '@nestjs/swagger';

export class GetMemberDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetMemberDto>) {
    Object.assign(this, partial);
  }
}
