import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ActionLogRepository } from 'src/action-log/repositories/action-log.repository';
import { AssessmentLayer } from 'src/assessment/entities/assessment-layer.entity';
import { AssessmentRequest } from 'src/assessment/entities/assessment-request.entity';
import { AssessmentLayerRepository } from 'src/assessment/repositories/assessment-layer.repository';
import { AssessmentRequestRepository } from 'src/assessment/repositories/assessment-request.repository';
import { ActionLogStatusEnum } from 'src/common/enums/action-log.enum';
import { ActionEnum } from 'src/common/enums/action.enum';
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
    private readonly requestSpecItemService: RequestSpecItemService,
    private readonly assessmentLayerRepository: AssessmentLayerRepository,
    private readonly validationService: ValidationService,
    private i18nService: I18nService,
  ) {}

  //------------------------------
  async create(
    data: CreateSpecContentDto,
    member: Member,
    memberRoles: Role[],
  ) {
    const { specItemId, value, assessmentRequestId } = data;
    const where: FindOptionsWhere<AssessmentRequest> = {
      id: assessmentRequestId,
    };

    const teamMemberIds =
      await this.groupMembershipRepository.getUserTeamMembers(member.id);
    where.applicantId = In(teamMemberIds);

    const request = await this.assessmentRequestRepository.findOne({
      where,
      relations: {
        assessmentLayers: { assessmentType: true },
        requestSpecContents: true,
        asset: true,
      },
    });

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

    if (foundItem.assessmentType) {
      for (let i = 0; i < foundItem.assessmentType.length; i++) {
        const element = foundItem.assessmentType[i];

        const layer = request.assessmentLayers?.find(
          (layer) => layer.assessmentTypeId === element.id,
        );

        if (!layer) {
          continue;
        }

        await this.actionLogRepository.save({
          action: ActionEnum.PendingLayerSpecsSubmit,
          userId: member.id,
          roleIds: memberRoles.map((r) => r.id),
          status: ActionLogStatusEnum.SUCCESS,
          assessmentRequestId: request.id,
          assessmentLayerId: layer.id,
          assessmentLayerCurrentStateId: layer.stateId,
          assessmentLayerNextStateId: layer.stateId,
        });
      }
    }

    if (!exists) {
      await this.requestSpecContentRepository.save(body);
      return 'saved';
    } else {
      await this.requestSpecContentRepository.update({ id: exists.id }, body);
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
    } else {
      return this.requestSpecContentRepository.update({ id: exists.id }, body);
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
