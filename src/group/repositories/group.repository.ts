import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AssetToAudit } from 'src/asset/entities/asset-to-audit.entity';
import { AbstractRepository } from 'src/database/abstract.repository';
import { GroupMembership } from 'src/group-membership/entities/group-membership.entity';
import { DataSource, Repository } from 'typeorm';
import { Group } from '../entities/group.entity';

@Injectable()
export class GroupRepository extends AbstractRepository<Group> {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    private i18nService: I18nService,
  ) {
    super(groupRepository, i18nService);
  }

  //------------------------------
  async createGroup(
    userId: string,
    assetToAuditId: string,
    bindingType: string,
    superiorId?: string | null,
    groupName?: string,
    assetTitle?: string,
    assetTypeId?: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let assetToAudit = await queryRunner.manager.findOne(AssetToAudit, {
        where: { referenceId: assetToAuditId },
      });

      if (!assetToAudit) {
        assetToAudit = await queryRunner.manager.save(AssetToAudit, {
          referenceId: assetToAuditId,
          title: assetTitle,
          assetTypeId: assetTypeId,
        });
      }

      const group: any = {};
      group.name = groupName || `Group-${Date.now()}`;
      group.asset = assetToAudit;
      group.bindingType = bindingType;
      group.superiorId = superiorId;

      const savedGroup = await queryRunner.manager.save(
        Group,
        new Group(group),
      );

      const groupMembership: any = {};
      groupMembership.userId = userId;
      groupMembership.isLead = true;
      groupMembership.group = savedGroup;

      await queryRunner.manager.save(
        GroupMembership,
        new GroupMembership(groupMembership),
      );

      await queryRunner.commitTransaction();

      return {
        group: savedGroup,
        membership: groupMembership,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
