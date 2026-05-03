import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AssetService } from 'src/asset/services/asset-to-audit.service';
import { GroupMembershipService } from 'src/group-membership/services/group-membership.service';
import { Member } from 'src/member/entities/member.entity';
import { MemberService } from 'src/member/services/member.service';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';
import { CreateGroupDto } from '../dto/input/create-group.dto';
import { Group } from '../entities/group.entity';
import { GroupRepository } from '../repositories/group.repository';

@Injectable()
export class GroupService {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly memberService: MemberService,
    private readonly assetService: AssetService,
    private readonly i18nService: I18nService,
    @Inject(forwardRef(() => GroupMembershipService))
    private readonly groupMembershipService: GroupMembershipService,
  ) {}

  //------------------------------
  async findOne(data: FindOneOptions<Group>): Promise<Group | null> {
    return this.groupRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.groupRepository.findAll();
  }

  //------------------------------
  async update(data: FindOptionsWhere<Group>, updateGroup: Partial<Group>) {
    return this.groupRepository.update(data, updateGroup);
  }

  //------------------------------
  async remove(data: FindOptionsWhere<Group>) {
    return this.groupRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number, memberId: string) {
    return this.groupRepository.findAllPagination(skip, take, {
      order: { createdAt: 'DESC' },
      relations: { asset: true, groupMembership: true },
      where: { groupMembership: { isLead: true, userId: memberId } },
    });
  }

  //------------------------------
  async createGroup(data: CreateGroupDto, member: Member) {
    const { assetReferenceId, assetTitle, assetTypeId } = data;
    // const groupName = await this.groupNameGenerator(
    //   assetReferenceId,
    //   applicantManagerId,
    // );

    const groupName = `${assetReferenceId} ${member.id}`;
    const foundGroup = await this.findOne({
      where: { name: groupName },
      relations: { asset: true },
    });
    if (foundGroup) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_DUPLICATE_GROUP'),
      );
    }

    const createdGroup = await this.groupRepository.createGroup(
      member.id,
      assetReferenceId,
      data.bindingType,
      data.superiorId,
      groupName,
      assetTitle,
      assetTypeId,
    );

    return createdGroup; // return result in json with key-name createdMembership
  }

  //------------------------------
  // private async groupNameGenerator(
  //   assetReferenceId: string,
  //   applicantManagerId: string,
  // ): Promise<string> {
  //   const [applicant, asset] = await Promise.all([
  //     this.memberService.findOne({ where: { id: applicantManagerId } }),
  //     this.assetService.findOne({ where: { id: assetReferenceId } }),
  //   ]);

  //   if (!applicant || !asset) {
  //     throw new BadRequestException(
  //       this.i18nService.t(
  //         'messages.ERROR_NOT_FOUND_ASSETS_OR_APPLICANT_MANAGER',
  //       ),
  //     );
  //   }

  //   const IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
  //     'IDP_SERVICE_INTERNAL_TOKEN',
  //     'share',
  //   );
  //   const IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');

  //   const applicantInfo = await axios.get(
  //     `${IDP_SERVICE_URL}/${applicantManagerId}`,
  //     {
  //       headers: {
  //         'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
  //       },
  //     },
  //   );

  //   if (!applicantInfo) {
  //     throw new BadRequestException(
  //       this.i18nService.t('messages.ERROR_APPLICANT_INFO'),
  //     );
  //   }

  //   const groupName = `${asset.title} - ${applicantInfo.data.firstName} ${applicantInfo.data.lastName}`;
  //   return groupName;
  // }
}
