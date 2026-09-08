import { ApiProperty } from '@nestjs/swagger';

export class GetTestcaseRemediateDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetTestcaseRemediateDto>) {
    Object.assign(this, partial);
  }
}
