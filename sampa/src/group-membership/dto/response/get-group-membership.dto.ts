import { ApiProperty } from '@nestjs/swagger';

export class GetGroupMembershipDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetGroupMembershipDto>) {
    Object.assign(this, partial);
  }
}
