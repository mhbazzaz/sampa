import { AssetToAudit } from 'src/asset/entities/asset-to-audit.entity';
import { BindingType } from 'src/common/enums/binding-type.enum';
import { AbstractEntity } from 'src/database/abstract.entity';
import { GroupMembership } from 'src/group-membership/entities/group-membership.entity';
import { Role } from 'src/role/entities/role.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

@Entity()
@Index('group_name', ['name'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Group extends AbstractEntity<Group> {
  @Column({ type: String })
  name: string;

  @Column({
    type: 'enum',
    enum: BindingType,
    default: BindingType.RequestBased,
  })
  bindingType: BindingType;

  @Column({ nullable: true, type: String })
  superiorId: string | null;

  @OneToOne(() => Group)
  parent?: Group;

  @OneToOne(() => Group)
  child?: Group;

  @OneToMany(() => GroupMembership, (groupMembership) => groupMembership.group)
  groupMembership?: GroupMembership[];

  @ManyToMany(() => Role, (role) => role.groups)
  @JoinTable()
  roles?: Role[];

  @Column()
  assetId: string;

  @ManyToOne(() => AssetToAudit)
  asset?: AssetToAudit;
}
