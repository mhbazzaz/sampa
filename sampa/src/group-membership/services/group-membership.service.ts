import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { I18nService } from 'nestjs-i18n';
import { userMapperLevel1 } from 'src/common/helpers/user-mapper-level-1';
import { GroupService } from 'src/group/services/group.service';
import { Member } from 'src/member/entities/member.entity';
import { MemberRepository } from 'src/member/repositories/member.repository';
import { Vault } from 'src/vault/vault';
import { FindOneOptions, FindOptionsWhere, In, Not } from 'typeorm';
import { CreateGroupMembershipDto } from '../dto/input/create-group-membership.dto';
import { UpdateGroupMembershipDto } from '../dto/input/update-group-membership.dto';
import { GroupMembership } from '../entities/group-membership.entity';
import { GroupMembershipRepository } from '../repositories/group-membership.repository';

@Injectable()
export class GroupMembershipService {
  constructor(
    private readonly groupMembershipRepository: GroupMembershipRepository,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: GroupService,
    private memberRepository: MemberRepository,
    private i18nService: I18nService,
  ) {}

  //------------------------------
  async create(data: CreateGroupMembershipDto): Promise<GroupMembership[]> {
    const { usersData, groupId } = data;

    const groupMembers: {
      userId: string;
      groupId: string;
      isLead: boolean;
      isMember: boolean;
    }[] = [];

    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    for (let index = 0; index < usersData.length; index++) {
      const element = usersData[index];

      try {
        const response = await axios.post<{ data: { id: string } }>(
          `${IDP_SERVICE_URL}/idp/api/v1/users/create-by-username`,
          {
            username: element.username,
          },
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );

        element.userId = response.data.data.id;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            throw new BadRequestException(error.response.data.message);
          }
          throw error;
        }
      }
    }

    await userMapperLevel1(usersData, 'userId');

    for (let index = 0; index < usersData.length; index++) {
      const element = usersData[index];

      const user = await this.memberRepository.findOne({
        where: { id: element.user.id },
      });
      if (user) {
        user.firstName = element.user.firstName;
        user.lastName = element.user.lastName;
        user.username = element.user.username;
        user.domain = element.user.domain;
        await this.memberRepository.save(user);
      } else {
        await this.memberRepository.save({
          id: element.user.id,
          firstName: element.user.firstName,
          lastName: element.user.lastName,
          username: element.user.username,
          domain: element.user.domain,
        });
      }

      groupMembers.push({
        userId: element.userId,
        groupId,
        isLead: element.isLead,
        isMember: element.isMember,
      });
    }

    return await Promise.all(
      groupMembers.map((groupMember) =>
        this.groupMembershipRepository.save(groupMember),
      ),
    );
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<GroupMembership>,
  ): Promise<GroupMembership | null> {
    return this.groupMembershipRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.groupMembershipRepository.findAll();
  }

  //------------------------------
  async findOneWithGroupId(groupId: string) {
    return this.groupMembershipRepository.findAll({
      where: { groupId, isLead: false },
      select: {
        userId: true,
        user: { firstName: true, lastName: true, username: true, domain: true },
      },
      relations: { user: true },
    });
  }

  //------------------------------
  async update(
    updateGroupMembership: UpdateGroupMembershipDto,
    member: Member,
  ) {
    let { usersData } = updateGroupMembership;
    const { groupId } = updateGroupMembership;

    const foundGroup = await this.groupService.findOne({
      where: { id: groupId },
    });

    if (!foundGroup) {
      throw new NotFoundException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_RECORD'),
      );
    }

    if (usersData?.length === 0) {
      return await Promise.all([
        this.groupMembershipRepository.findAndDelete({
          groupId: groupId,
        }),
        this.groupService.remove({
          id: groupId,
        }),
      ]);
    }

    usersData = usersData ? usersData : [];

    const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

    const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );
    for (let index = 0; index < usersData.length; index++) {
      const element = usersData[index];

      try {
        const response = await axios.post<{ data: { id: string } }>(
          `${IDP_SERVICE_URL}/idp/api/v1/users/create-by-username`,
          {
            username: element.username,
          },
          {
            headers: {
              'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            },
          },
        );

        element.userId = response.data.data.id;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            throw new BadRequestException(error.response.data.message);
          }
          throw error;
        }
        throw error;
      }
    }

    await this.groupMembershipRepository.findAndDelete({
      groupId: groupId,
      isMember: true,
      userId: Not(In(usersData.map((user) => user.userId))),
    });

    await userMapperLevel1(usersData, 'userId');

    for (let i = 0; i < usersData.length; i++) {
      const element = usersData[i];

      const user = await this.memberRepository.findOne({
        where: { id: element.user.id },
      });
      if (user) {
        user.firstName = element.user.firstName;
        user.lastName = element.user.lastName;
        user.username = element.user.username;
        user.domain = element.user.domain;
        await this.memberRepository.save(user);
      } else {
        await this.memberRepository.save({
          id: element.user.id,
          firstName: element.user.firstName,
          lastName: element.user.lastName,
          username: element.user.username,
          domain: element.user.domain,
        });
      }

      const groupMembership = await this.groupMembershipRepository.findOneBy({
        groupId: groupId,
        isMember: true,
        userId: element.userId,
      });

      if (groupMembership) {
        groupMembership.isLead = element.isLead;
        groupMembership.isMember = element.isMember;
        await this.groupMembershipRepository.save(groupMembership);
        continue;
      }

      await this.groupMembershipRepository.save({
        groupId: groupId,
        userId: element.userId,
        isLead: element.isLead,
        isMember: element.isMember,
      });
    }
  }

  //------------------------------
  async remove(data: FindOptionsWhere<GroupMembership>) {
    return this.groupMembershipRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return this.groupMembershipRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
    });
  }
}
