import { ApiResponseProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiResponseProperty()
  message: string;

  @ApiResponseProperty()
  data: object;

  @ApiResponseProperty()
  statusCode: number;

  constructor(partial: Partial<FileResponseDto>) {
    Object.assign(this, partial);
  }
}
