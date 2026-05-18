import { Asset } from 'src/asset/entities/asset.entity';
import {
  ActionLogStatusEnum,
  UserActionEnum,
} from 'src/common/enums/action-log.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class ActionLog extends AbstractEntity<ActionLog> {
  @Column({ type: String, nullable: false })
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: String, nullable: true })
  ipAddress: string | null;

  @Column({
    type: 'text',
    array: true,
  })
  roleIds: string[];

  @Column({
    type: 'enum',
    enum: UserActionEnum,
  })
  action: UserActionEnum;

  @Column()
  assetId: string;

  @Column({ type: String, nullable: true })
  assetOldBaseline: string | null;

  @Column({ type: String, nullable: true })
  assetNewBaseline: string | null;

  @ManyToOne(() => Asset)
  asset: Asset;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  changes?: {
    updateData: string;
    oldValue: any;
    newValue: any;
  }[];

  @Column({
    type: 'enum',
    enum: ActionLogStatusEnum,
  })
  status: ActionLogStatusEnum;
}
