import { ApiProperty } from '@nestjs/swagger';

export class GetActionDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetActionDto>) {
    Object.assign(this, partial);
  }
}
