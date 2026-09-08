import { ActionLog } from 'src/action-log/entities/action-log.entity';
import { Role } from 'src/role/entities/role.entity';

export interface IDPUser {
  id: string;

  isEnable: boolean | null;

  roles?: Role[];

  actionLogs?: ActionLog[];

  username: string;
}
