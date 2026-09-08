import { SetMetadata } from '@nestjs/common';
import { ProcessEnum } from '../enums/process.enum';

export const Process = (Process: ProcessEnum) =>
  SetMetadata('process', Process);
