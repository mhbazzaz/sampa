import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AssessmentTypeRepository } from 'src/assessment/repositories/assessment-type.repository';
import { FindOneOptions, FindOptionsWhere, ILike } from 'typeorm';
import { CreateTestcaseGroupDto } from '../dto/input/create-test-case-group.dto';
import { FindAllTestcaseGroupDto } from '../dto/input/find-all-test-case-group-quey.dto';
import { UpdateTestcaseGroupDto } from '../dto/input/update-test-case-group.dto';
import { TestcaseGroup } from '../entities/testcase-group.entity';
import { TestcaseGroupRepository } from '../repositories/testcase-group.repository';
import { TestcaseItemRepository } from '../repositories/testcase-item.repository';

@Injectable()
export class TestcaseGroupService {
  constructor(
    private readonly testcaseGroupRepository: TestcaseGroupRepository,
    private readonly testcaseItemRepository: TestcaseItemRepository,
    private readonly assessmentTypeRepository: AssessmentTypeRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(data: CreateTestcaseGroupDto): Promise<TestcaseGroup> {
    return this.testcaseGroupRepository.save(data);
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<TestcaseGroup>,
  ): Promise<TestcaseGroup | null> {
    return this.testcaseGroupRepository.findOne({
      ...data,
      relations: { assessmentType: { assessmentLayers: true } },
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async findAll() {
    return this.testcaseGroupRepository.findAll({
      relations: { assessmentType: { assessmentLayers: true } },
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<TestcaseGroup>,
    updateDto: UpdateTestcaseGroupDto,
  ): Promise<TestcaseGroup> {
    const updatePayload: Partial<TestcaseGroup> = {};

    if (updateDto.name !== undefined) updatePayload.name = updateDto.name;
    if (updateDto.nameFa !== undefined) updatePayload.nameFa = updateDto.nameFa;
    if (updateDto.description !== undefined)
      updatePayload.description = updateDto.description;

    if (updateDto.assessmentTypeId !== undefined) {
      const assessmentType = await this.assessmentTypeRepository.findOne({
        where: { id: updateDto.assessmentTypeId },
      });
      if (!assessmentType) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
            args: {
              value: updateDto.assessmentTypeId,
              property: 'AssessmentType',
            },
          }),
        );
      }
      updatePayload.assessmentType = assessmentType;
      updatePayload.assessmentTypeId = assessmentType.id;
    }

    return await this.testcaseGroupRepository.update(data, updatePayload);
  }

  //------------------------------
  async remove(id: string) {
    const testcaseItem = await this.testcaseItemRepository.findOne({
      where: { testcaseGroupId: id },
    });
    if (testcaseItem) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_HAS_RELATION', {
          args: { property: this.i18nService.t('objects.test case item') },
        }),
      );
    }
    return this.testcaseGroupRepository.findAndDelete({ id });
  }

  //------------------------------
  async findAllPagination(query: FindAllTestcaseGroupDto) {
    return this.testcaseGroupRepository.findAllPagination(
      query.skip,
      query.take,
      {
        where: {
          name: query.name ? ILike(`%${query.name}%`) : undefined,
          assessmentTypeId: query.assessmentTypeId ?? undefined,
        },
        relations: {
          testcaseItems: true,
          assessmentType: { assessmentLayers: true },
        },
        order: { createdAt: 'DESC' },
      },
    );
  }
}
