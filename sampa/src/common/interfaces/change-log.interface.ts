import { EntityTypeEnum } from '../enums/entity-type.enum';

export interface ChangeLog {
  entityType?: EntityTypeEnum;
  updateData: string;
  oldValue: any;
  newValue: any;
  oldDisplayValue?: any;
  newDisplayValue?: any;
}
