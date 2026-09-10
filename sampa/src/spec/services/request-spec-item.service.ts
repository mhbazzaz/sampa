import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ActionLogBufferService } from 'src/action-log/services/action-log-buffer.service';
import { AssessmentTypeRepository } from 'src/assessment/repositories/assessment-type.repository';
import { AssetTypeRepository } from 'src/asset/repositories/asset-type.repository';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { Environment } from 'src/environment/entities/environment.entity';
import { EnvironmentRepository } from 'src/environment/repositories/environment.repository';
import { FindOneOptions, FindOptionsWhere, In } from 'typeorm';
import { CreateSpecItemDto } from '../dto/input/create-spec-item.dto';
import { FindFilteredRequestSpecItemQueryDto } from '../dto/input/find-filtered-request-spec-item.dto';
import { GetSpecItemDto } from '../dto/input/get-spec-item.dto';
import { UpdateSpecItemDto } from '../dto/input/update-spec-item.dto';
import { RequestSpecItem } from '../entities/request-spec-item.entity';
import { RequestSpecItemRepository } from '../repositories/request-spec-item.repository';
import { EntityTypeEnum } from 'src/common/enums/entity-type.enum';

@Injectable()
export class RequestSpecItemService {
  constructor(
    private readonly requestSpecItemRepository: RequestSpecItemRepository,
    private readonly validationService: ValidationService,
    private readonly assetTypeRepository: AssetTypeRepository,
    private readonly environmentRepository: EnvironmentRepository,
    private readonly assessmentTypeRepository: AssessmentTypeRepository,
    private readonly i18nService: I18nService,
    private readonly actionLogBufferService: ActionLogBufferService,
  ) {}

  //------------------------------
  async create(data: CreateSpecItemDto): Promise<RequestSpecItem> {
    // await this.validationService.validateSchema(data.value);

    const body = { ...data, value: JSON.stringify(data.value) };
    return await this.requestSpecItemRepository.save(body);
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<RequestSpecItem>,
  ): Promise<RequestSpecItem | null> {
    return await this.requestSpecItemRepository.findOne({
      ...data,
      relations: {
        assessmentType: { assessmentLayers: true },
        assetType: true,
        environments: true,
      },
    });
  }

  //------------------------------
  async findAll() {
    return await this.requestSpecItemRepository.findAll({
      relations: {
        assessmentType: { assessmentLayers: true },
        assetType: true,
        environments: true,
      },
    });
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<RequestSpecItem>,
    updateRequestSpecItem: UpdateSpecItemDto,
    userId?: string,
  ) {
    const updatePayload: Partial<RequestSpecItem> = {};

    const currentSpec = await this.requestSpecItemRepository.findOne({
      where: data,
      relations: { environments: true },
    });

    if (!currentSpec) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
          args: { value: data.id, property: 'SpecId' },
        }),
      );
    }

    const beforeEntity: any = {
      id: currentSpec.id,
      value: currentSpec.value,
      isMultiValue: currentSpec.isMultiValue,
      isOptional: currentSpec.isOptional,
      name: currentSpec.name,
      description: currentSpec.description,
      requestSpecGroupId: currentSpec.requestSpecGroupId,
      assetTypeId: currentSpec.assetTypeId,
      environmentIds: currentSpec.environments?.map((env) => env.id) || [],
    };

    const updateDto: any = {
      id: currentSpec.id,
    };

    const newEnvironments: string[] = [];
    for (const [key, value] of Object.entries(updateRequestSpecItem)) {
      const typedKey = key as keyof UpdateSpecItemDto;

      if (value !== undefined) {
        switch (typedKey) {
          case 'value':
            await this.validationService.validateSchema(value);
            updatePayload[typedKey] = JSON.stringify(value);
            updateDto[typedKey] = JSON.stringify(value);
            break;

          case 'assessmentTypeIds':
            const assessmentTypes =
              await this.assessmentTypeRepository.findAllFiltered({
                where: { id: In(value as string[]) },
                order: { createdAt: 'ASC' },
              });

            if (assessmentTypes.length !== (value as string[]).length) {
              throw new BadRequestException(
                this.i18nService.t('messages.ERROR_ASSESSMENT_TYPE_ID_INVALID'),
              );
            }
            updatePayload['assessmentType'] = assessmentTypes;
            break;

          case 'assetTypeId':
            const assetType = await this.assetTypeRepository.findOne({
              where: { id: value as string },
            });

            if (!assetType) {
              throw new BadRequestException(
                this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
                  args: { value: value, property: 'AssetType' },
                }),
              );
            }
            updatePayload[typedKey] = assetType.id;
            updateDto[typedKey] = assetType.id;
            break;

          case 'environmentIds':
            updatePayload['environments'] = (value as string[]).map(
              (v) => new Environment({ id: v }),
            );
            updateDto['environmentIds'] = value as string[];
            break;

          default:
            if (typedKey !== 'environmentId') {
              updatePayload[typedKey] = value;
              updateDto[typedKey] = value;
            }
            break;
        }
      }
    }

    const result = await this.requestSpecItemRepository.update(
      data,
      updatePayload,
    );

    if (userId && Object.keys(updateDto).length > 1) {
      const specContents = await this.requestSpecItemRepository.query(
        `SELECT DISTINCT "assessmentRequestId" FROM "request_spec_content" WHERE "requestSpecItemId" = $1`,
        [currentSpec.id],
      );

      if (specContents && specContents.length > 0) {
        for (const content of specContents) {
          await this.actionLogBufferService.addChange(
            { assessmentRequestId: content.assessmentRequestId },
            {
              entityType: EntityTypeEnum.SpecItem,
              beforeEntity,
              updateDto,
              userId,
              assessmentRequestCurrentStateId: null,
              assessmentRequestNextStateId: null,
              assessmentLayerCurrentStateId: null,
              assessmentLayerNextStateId: null,
            },
          );
        }
      }
    }

    return result;
  }

  //------------------------------
  async getFilteredRequestSpecItems(
    query: FindFilteredRequestSpecItemQueryDto,
  ) {
    return await this.requestSpecItemRepository.findFilteredRequestSpecItems(
      query,
    );
  }

  //------------------------------
  async findAllPagination(skip: number, take: number) {
    return await this.requestSpecItemRepository.findAllPagination(skip, take, {
      relations: { assessmentType: { assessmentLayers: true } },
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async findAllPaginationUserScope(query: GetSpecItemDto) {
    return await this.requestSpecItemRepository.findAllPagination(
      query.skip,
      query.take,
      {
        where: {
          assessmentType:
            query.assessmentTypeIds && query.assessmentTypeIds.length > 0
              ? { id: In(query.assessmentTypeIds) }
              : undefined,
          environments: query.environmentId
            ? { id: query.environmentId }
            : undefined,
          assetTypeId: query.assetTypeId ? query.assetTypeId : undefined,
        },
        relations: { assessmentType: { assessmentLayers: true } },
        order: { createdAt: 'DESC' },
      },
    );
  }

  //------------------------------
  async removeRequestSpecItem(id: string) {
    const relations = [];
    const row = await this.requestSpecItemRepository.findOne({
      where: { id },
      relations: { requestSpecContents: true },
    });
    if (!row) {
      throw new NotFoundException();
    }
    if (row.requestSpecContents && row.requestSpecContents.length > 0) {
      relations.push(this.i18nService.t('objects.request spec content'));
    }
    if (relations.length > 0) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_HAS_RELATION', {
          args: {
            property: relations.join(` ${this.i18nService.t('objects.and')} `),
          },
        }),
      );
    }

    return await this.requestSpecItemRepository.findAndDelete({ id });
  }

  //------------------------------
  async removeRelations(id: string) {
    return await this.requestSpecItemRepository.removeRequestSpecItemRelations(
      id,
    );
  }
}
