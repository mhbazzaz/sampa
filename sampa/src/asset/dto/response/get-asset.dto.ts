import { ApiProperty } from '@nestjs/swagger';

export class GetAssetDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetAssetDto>) {
    Object.assign(this, partial);
  }
}
