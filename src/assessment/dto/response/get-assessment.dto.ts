import { ApiProperty } from '@nestjs/swagger';

export class GetAssessmentDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetAssessmentDto>) {
    Object.assign(this, partial);
  }
}
