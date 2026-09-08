import { ApiResponseProperty } from '@nestjs/swagger';

export class GetFilterDto {
  @ApiResponseProperty()
  message: string;

  @ApiResponseProperty()
  data: object;

  @ApiResponseProperty()
  statusCode: number;

  constructor(partial: Partial<GetFilterDto>) {
    Object.assign(this, partial);
  }
}
