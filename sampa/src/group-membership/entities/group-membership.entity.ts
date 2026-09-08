import { AbstractEntity } from 'src/database/abstract.entity';
import { Group } from 'src/group/entities/group.entity';
import { Member } from 'src/member/entities/member.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class GroupMembership extends AbstractEntity<GroupMembership> {
  @Column({ nullable: true })
  userId: string;

  @Column({ type: Boolean, default: false })
  isLead: boolean;

  @Column({ type: Boolean, default: false })
  isMember: boolean;

  @Column('uuid')
  groupId: string;

  @ManyToOne(() => Group)
  group?: Group;

  @ManyToOne(() => Member)
  user?: Member;
}
