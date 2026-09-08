import { ApiResponseProperty } from '@nestjs/swagger';

export class GetAssetDto {
  @ApiResponseProperty()
  message: string;

  @ApiResponseProperty()
  data: object;

  @ApiResponseProperty()
  statusCode: number;

  constructor(partial: Partial<GetAssetDto>) {
    Object.assign(this, partial);
  }
}
