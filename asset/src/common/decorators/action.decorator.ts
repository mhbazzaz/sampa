import { SetMetadata } from '@nestjs/common';
import { ActionEnum } from '../enums/action.enum';

export const Action = (...Action: ActionEnum[]) =>
  SetMetadata('action', Action);
