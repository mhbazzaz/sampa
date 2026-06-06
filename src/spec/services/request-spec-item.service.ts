import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
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

@Injectable()
export class RequestSpecItemService {
  constructor(
    private readonly requestSpecItemRepository: RequestSpecItemRepository,
    private readonly validationService: ValidationService,
    private readonly assetTypeRepository: AssetTypeRepository,
    private readonly environmentRepository: EnvironmentRepository,
    private readonly assessmentTypeRepository: AssessmentTypeRepository,
    private readonly i18nService: I18nService,
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
  ) {
    const updatePayload: Partial<RequestSpecItem> = {};

    const currentSpec = await this.requestSpecItemRepository.findOne({
      where: data,
    });

    if (!currentSpec) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
          args: { value: data.id, property: 'SpecId' },
        }),
      );
    }

    const newEnvironments: string[] = [];
    for (const [key, value] of Object.entries(updateRequestSpecItem)) {
      const typedKey = key as keyof UpdateSpecItemDto;

      if (value !== undefined) {
        switch (typedKey) {
          case 'value':
            await this.validationService.validateSchema(value);
            updatePayload[typedKey] = JSON.stringify(value);
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
            break;

          case 'environmentIds':
            updatePayload['environments'] = (value as string[]).map(
              (v) => new Environment({ id: v }),
            );
            break;

          default:
            if (typedKey !== 'environmentId') {
              updatePayload[typedKey] = value;
            }
            break;
        }
      }
    }

    return await this.requestSpecItemRepository.update(data, updatePayload);
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
