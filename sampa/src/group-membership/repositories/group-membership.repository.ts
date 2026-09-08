import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { In, Repository } from 'typeorm';
import { GroupMembership } from '../entities/group-membership.entity';

@Injectable()
export class GroupMembershipRepository extends AbstractRepository<GroupMembership> {
  constructor(
    @InjectRepository(GroupMembership)
    private groupMembershipRepository: Repository<GroupMembership>,
    private i18nService: I18nService,
  ) {
    super(groupMembershipRepository, i18nService);
  }

  async getUserTeamMembers(memberId: string) {
    const groups = await this.findAll({
      where: { userId: memberId, isMember: true },
      select: { groupId: true },
    });
    const members = await this.findAll({
      where: { groupId: In(groups.map((group) => group.groupId)) },
      select: { userId: true },
    });
    return members.map((member) => member.userId);
  }
}
