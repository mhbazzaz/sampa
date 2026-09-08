import { ApiProperty } from '@nestjs/swagger';

export class GetTestcaseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: object;

  @ApiProperty()
  statusCode: number;

  constructor(partial: Partial<GetTestcaseDto>) {
    Object.assign(this, partial);
  }
}
