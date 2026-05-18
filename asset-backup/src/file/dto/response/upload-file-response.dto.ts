import { ApiResponseProperty } from '@nestjs/swagger';

export class UploadFileResponseDto {
  @ApiResponseProperty()
  referenceId: string;

  @ApiResponseProperty()
  message: string;

  @ApiResponseProperty()
  errors: boolean;
}
