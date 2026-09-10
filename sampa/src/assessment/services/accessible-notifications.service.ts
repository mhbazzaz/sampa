import { Injectable } from '@nestjs/common';
import { ActionRepository } from 'src/action/repositories/action.repository';
import { Member } from 'src/member/entities/member.entity';
import { Role } from 'src/role/entities/role.entity';
import { In } from 'typeorm';
import { NotificationManagementClient } from '../clients/notification-management.client';
import { FindAccessibleNotificationsQueryDto } from '../dto/input/find-accessible-notifications.dto';
import { AssessmentLayerRepository } from '../repositories/assessment-layer.repository';
import { AssessmentRequestRepository } from '../repositories/assessment-request.repository';

@Injectable()
export class AccessibleNotificationsService {
  constructor(
    private readonly assessmentRequestRepository: AssessmentRequestRepository,
    private readonly assessmentLayerRepository: AssessmentLayerRepository,
    private readonly actionRepository: ActionRepository,
    private readonly notificationManagementClient: NotificationManagementClient,
  ) {}

  async getAccessibleNotifications(
    member: Member,
    memberRoles: Role[],
    query: FindAccessibleNotificationsQueryDto,
  ) {
    const actions = await this.actionRepository.findAll({
      select: { id: true, name: true, process: { name: true } },
      relations: ['process'],
      where: {
        roles: { id: In(memberRoles.map((role) => role.id)) },
      },
    });

    const requestIds =
      await this.assessmentRequestRepository.getAccessibleRequestIds(
        member,
        memberRoles,
        actions,
      );

    const layerIds = await this.assessmentLayerRepository.getAccessibleLayerIds(
      member,
      memberRoles,
      actions,
      requestIds,
    );

    const sourceIds = Array.from(new Set([...requestIds, ...layerIds]));

    if (sourceIds.length === 0) {
      return {
        data: [],
        count: 0,
      };
    }

    return this.notificationManagementClient.getAccessibleEvents(
      query,
      sourceIds,
    );
  }
}
