import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ActionLogRepository } from 'src/action-log/repositories/action-log.repository';
import { ActionLogBufferService } from 'src/action-log/services/action-log-buffer.service';
import { ActionRepository } from 'src/action/repositories/action.repository';
import { AssessmentLayer } from 'src/assessment/entities/assessment-layer.entity';
import { AssessmentLayerRepository } from 'src/assessment/repositories/assessment-layer.repository';
import { AssessmentRequestRepository } from 'src/assessment/repositories/assessment-request.repository';
import { EntityTypeEnum } from 'src/common/enums/entity-type.enum';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { GroupMembershipRepository } from 'src/group-membership/repositories/group-membership.repository';
import { Member } from 'src/member/entities/member.entity';
import { Role } from 'src/role/entities/role.entity';
import { FindOneOptions, FindOptionsWhere, In } from 'typeorm';
import { CreateSpecContentDto } from '../dto/input/create-spec-content.dto';
import { UpdateSpecContentLayerDto } from '../dto/input/update-spec-content-layer.dto';
import { UpdateSpecContentDto } from '../dto/input/update-spec-content.dto';
import { RequestSpecContent } from '../entities/request-spec-content.entity';
import { RequestSpecContentRepository } from '../repositories/request-spec-content.repository';
import { RequestSpecItemService } from './request-spec-item.service';

@Injectable()
export class RequestSpecContentService {
  constructor(
    private readonly requestSpecContentRepository: RequestSpecContentRepository,
    private readonly groupMembershipRepository: GroupMembershipRepository,
    private readonly assessmentRequestRepository: AssessmentRequestRepository,
    private readonly actionLogRepository: ActionLogRepository,
    private readonly actionRepository: ActionRepository,
    private readonly requestSpecItemService: RequestSpecItemService,
    private readonly assessmentLayerRepository: AssessmentLayerRepository,
    private readonly validationService: ValidationService,
    private i18nService: I18nService,
    private readonly actionLogBufferService: ActionLogBufferService,
  ) {}

  //------------------------------
  async create(
    data: CreateSpecContentDto,
    member: Member,
    memberRoles: Role[],
  ) {
    const { specItemId, value, assessmentRequestId } = data;

    const actions = await this.actionRepository.findAll({
      select: { id: true, name: true, process: { name: true } },
      relations: ['process'],
      where: {
        roles: { id: In(memberRoles.map((memberRole) => memberRole.id)) },
      },
    });

    const request =
      await this.assessmentRequestRepository.getRequestWhetherUserCanReadItOrItIsUsers(
        assessmentRequestId,
        member,
        memberRoles,
        actions,
        ['assessmentLayers.assessmentType', 'requestSpecContents', 'asset'],
      );

    if (!request) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'request' },
        }),
      );
    }

    const foundItem = await this.requestSpecItemService.findOne({
      where: { id: specItemId },
      relations: { assessmentType: true },
    });

    const schema = foundItem?.value;
    if (!schema) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_SCHEMA_IS_NOT_DEFINED'),
      );
    }

    await this.validationService.validate(JSON.parse(schema), value);

    const requestSpecContents = await this.requestSpecContentRepository.findAll(
      {
        where: {
          assessmentRequestId: assessmentRequestId,
          // requestSpecItemId: specItemId,
        },
      },
    );
    const body = {
      value: JSON.stringify(value),
      assessmentRequestId,
      requestSpecItemId: specItemId,
    };

    const exists = requestSpecContents.find(
      (requestSpecContent) =>
        requestSpecContent.requestSpecItemId === specItemId,
    );

    if (!exists) {
      await this.requestSpecContentRepository.save(body);

      await this.actionLogBufferService.addChange(
        { assessmentRequestId },
        {
          entityType: EntityTypeEnum.SpecContent,
          beforeEntity: {},
          updateDto: body,
          userId: member.id,
          assessmentRequestCurrentStateId: request.stateId,
          assessmentRequestNextStateId: request.stateId,
          assessmentLayerCurrentStateId: null,
          assessmentLayerNextStateId: null,
        },
      );

      return 'saved';
    } else {
      const beforeEntity = await this.requestSpecContentRepository.findOne({
        where: { id: exists.id },
      });
      await this.requestSpecContentRepository.update({ id: exists.id }, body);

      await this.actionLogBufferService.addChange(
        { assessmentRequestId },
        {
          entityType: EntityTypeEnum.SpecContent,
          beforeEntity: beforeEntity || {},
          updateDto: body,
          userId: member.id,
          assessmentRequestCurrentStateId: request.stateId,
          assessmentRequestNextStateId: request.stateId,
          assessmentLayerCurrentStateId: null,
          assessmentLayerNextStateId: null,
        },
      );

      return 'updated';
    }
  }

  //------------------------------
  async updateSpecForLayer(data: UpdateSpecContentLayerDto, member: Member) {
    const { specItemId, value, assessmentLayerId } = data;
    const where: FindOptionsWhere<AssessmentLayer> = {
      id: assessmentLayerId,
    };

    where.assessmentTeams = { memberId: member.id };

    const layer = await this.assessmentLayerRepository.findOne({
      where,
      relations: { assessmentRequest: true },
    });

    if (!layer) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
          args: { property: 'layer' },
        }),
      );
    }

    const foundItem = await this.requestSpecItemService.findOne({
      where: { id: specItemId },
    });

    const schema = foundItem?.value;
    if (!schema) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_SCHEMA_IS_NOT_DEFINED'),
      );
    }

    await this.validationService.validate(JSON.parse(schema), value);

    const exists = await this.requestSpecContentRepository.findOne({
      where: {
        assessmentRequestId: layer.assessmentRequestId,
        requestSpecItemId: specItemId,
      },
    });
    const body = {
      value: JSON.stringify(value),
      assessmentRequestId: layer.assessmentRequestId,
      requestSpecItemId: specItemId,
    };
    if (!exists) {
      await this.requestSpecContentRepository.save(body);

      await this.actionLogBufferService.addChange(
        { assessmentRequestId: layer.assessmentRequestId, assessmentLayerId },
        {
          entityType: EntityTypeEnum.SpecContent,
          beforeEntity: {},
          updateDto: body,
          userId: member.id,
          assessmentRequestCurrentStateId:
            layer.assessmentRequest?.stateId ?? null,
          assessmentRequestNextStateId:
            layer.assessmentRequest?.stateId ?? null,
          assessmentLayerCurrentStateId: layer.stateId,
          assessmentLayerNextStateId: layer.stateId,
        },
      );
    } else {
      const beforeEntity = await this.requestSpecContentRepository.findOne({
        where: { id: exists.id },
      });
      const updated = await this.requestSpecContentRepository.update(
        { id: exists.id },
        body,
      );

      await this.actionLogBufferService.addChange(
        { assessmentRequestId: layer.assessmentRequestId, assessmentLayerId },
        {
          entityType: EntityTypeEnum.SpecContent,
          beforeEntity: beforeEntity || {},
          updateDto: body,
          userId: member.id,
          assessmentRequestCurrentStateId:
            layer.assessmentRequest?.stateId ?? null,
          assessmentRequestNextStateId:
            layer.assessmentRequest?.stateId ?? null,
          assessmentLayerCurrentStateId: layer.stateId,
          assessmentLayerNextStateId: layer.stateId,
        },
      );
      return updated;
    }
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<RequestSpecContent>,
  ): Promise<RequestSpecContent | null> {
    return await this.requestSpecContentRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return await this.requestSpecContentRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<RequestSpecContent>,
    updateRequestSpecContent: UpdateSpecContentDto,
  ) {
    const { specItemId, value } = updateRequestSpecContent;

    const foundItem = await this.requestSpecItemService.findOne({
      where: { id: specItemId },
    });

    const schema = foundItem?.value;
    if (!schema) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_SCHEMA_IS_NOT_DEFINED'),
      );
    }

    await this.validationService.validate(JSON.parse(schema), value);

    return this.requestSpecContentRepository.update(data, {
      value: JSON.stringify(value),
    });
  }

  //------------------------------
  async remove(data: FindOptionsWhere<RequestSpecContent>) {
    return this.requestSpecContentRepository.findAndDelete(data);
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return await this.requestSpecContentRepository.findAllPagination(
      skip,
      take,
      {
        order: { createdAt: 'DESC' },
      },
    );
  }
}
