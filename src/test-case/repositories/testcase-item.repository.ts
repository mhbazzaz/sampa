import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AssetType } from 'src/asset/entities/asset-type.entity';
import { AssetTypeRepository } from 'src/asset/repositories/asset-type.repository';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Environment } from 'src/environment/entities/environment.entity';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { CreateTestcaseItemDto } from '../dto/input/create-test-case-item.dto';
import { FindFilteredTestcaseItemQueryDto } from '../dto/input/find-filtered-test-case-item.dto';
import { UpdateTestcaseItemDto } from '../dto/input/update-test-case-item.dto';
import { AssetTestCase } from '../entities/asset-test-case.entity';
import { TestcaseItem } from '../entities/testcase-item.entity';

@Injectable()
export class TestcaseItemRepository extends AbstractRepository<TestcaseItem> {
  constructor(
    @InjectRepository(TestcaseItem)
    private testcaseItemRepository: Repository<TestcaseItem>,
    private readonly assetTypeRepository: AssetTypeRepository,
    private readonly dataSource: DataSource,
    private i18nService: I18nService,
  ) {
    super(testcaseItemRepository, i18nService);
  }

  //------------------------------
  async findOneWithEnabledRelations(id: string): Promise<TestcaseItem | null> {
    return this.testcaseItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.testcaseGroup', 'testcaseGroup')
      .leftJoinAndSelect('testcaseGroup.assessmentType', 'assessmentType')
      .leftJoinAndSelect('item.testcaseContents', 'testcaseContents')
      .leftJoinAndSelect('item.environments', 'environments')
      .leftJoinAndSelect(
        'item.assetTestCases',
        'assetTestCases',
        'assetTestCases.isEnable = :isEnabled',
        { isEnabled: true },
      )
      .leftJoinAndSelect('assetTestCases.assetType', 'assetType')
      .where('item.id = :id', { id })
      .getOne();
  }

  //------------------------------
  async findAllWithEnabledRelations(): Promise<[TestcaseItem[], number]> {
    return this.testcaseItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.testcaseGroup', 'testcaseGroup')
      .leftJoinAndSelect('testcaseGroup.assessmentType', 'assessmentType')
      .leftJoinAndSelect('item.testcaseContents', 'testcaseContents')
      .leftJoinAndSelect('item.environments', 'environments')
      .leftJoinAndSelect(
        'item.assetTestCases',
        'assetTestCases',
        'assetTestCases.isEnable = :isEnabled',
        { isEnabled: true },
      )
      .leftJoinAndSelect('assetTestCases.assetType', 'assetType')
      .getManyAndCount();
  }

  //------------------------------
  async getFilteredTestcaseItems(
    query: FindFilteredTestcaseItemQueryDto,
  ): Promise<[TestcaseItem[], number]> {
    const qb = this.testcaseItemRepository
      .createQueryBuilder('testcaseItem')
      .leftJoinAndSelect('testcaseItem.environments', 'environments')
      .leftJoinAndSelect('testcaseItem.testcaseGroup', 'testcaseGroup')
      .leftJoinAndSelect('testcaseGroup.assessmentType', 'assessmentType')
      .leftJoinAndSelect('testcaseItem.assetTestCases', 'assetTestCase')
      .leftJoinAndSelect('testcaseItem.testcaseContents', 'testcaseContents');

    qb.andWhere('testcaseItem.isEnabled = :isEnabled', { isEnabled: true });

    if (query.environmentId) {
      qb.andWhere('environments.id = :environmentId', {
        environmentId: query.environmentId,
      });
    }

    if (query.testcaseGroupId) {
      qb.andWhere('testcaseItem.testcaseGroupId = :testcaseGroupId', {
        testcaseGroupId: query.testcaseGroupId,
      });
    }

    if (query.assetTypeId) {
      qb.andWhere('assetTestCase.assetTypeId = :assetTypeId', {
        assetTypeId: query.assetTypeId,
      });
    }

    if (query.assessmentTypeIds && query.assessmentTypeIds.length > 0) {
      qb.andWhere('assessmentType.id IN (:...assessmentTypeIds)', {
        assessmentTypeIds: query.assessmentTypeIds,
      });
    }

    if (query.take) {
      qb.take(query.take);
    }

    if (query.skip) {
      qb.skip(query.skip);
    }

    return qb.getManyAndCount();
  }

  //------------------------------
  async createTransactional(
    query: CreateTestcaseItemDto,
  ): Promise<TestcaseItem> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { assetTypeIds, ...testcaseItemData } = query;

      const testcaseItem = this.testcaseItemRepository.create({
        ...testcaseItemData,
        environments: query.environmentIds?.map(
          (environmentId) => new Environment({ id: environmentId }),
        ),
      });
      await queryRunner.manager.save(testcaseItem);

      if (assetTypeIds && assetTypeIds.length > 0) {
        const validAssetTypes = await queryRunner.manager.find(AssetType, {
          where: { id: In(assetTypeIds) },
        });

        const foundIds = validAssetTypes.map((a) => a.id);
        const invalidIds = assetTypeIds.filter((id) => !foundIds.includes(id));

        if (invalidIds.length > 0) {
          throw new BadRequestException({
            message: this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
              args: { value: invalidIds.join(', '), property: 'AssetType' },
            }),
          });
        }

        const assetTestCases: AssetTestCase[] = assetTypeIds.map(
          (assetTypeId) => {
            const assetTestCase = new AssetTestCase({});
            assetTestCase.assetTypeId = assetTypeId;
            assetTestCase.isEnable = true;
            assetTestCase.testcaseItemId = testcaseItem.id;
            return assetTestCase;
          },
        );

        await queryRunner.manager.save(assetTestCases);
      }

      await queryRunner.commitTransaction();
      return testcaseItem;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  //------------------------------
  async updateTransactional(
    data: FindOptionsWhere<TestcaseItem>,
    query: UpdateTestcaseItemDto,
  ): Promise<TestcaseItem | null> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const testcaseItem = await queryRunner.manager.findOne(TestcaseItem, {
        where: { id: data.id },
        relations: { assetTestCases: true },
      });

      if (!testcaseItem) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND_PROPERTY', {
            args: {
              value: data.id,
              property: 'TestcaseItem',
            },
          }),
        );
      }

      const { assetTypeIds, ...updateData } = query;

      Object.assign(testcaseItem, updateData);

      testcaseItem.environments = query.environmentIds?.map(
        (environmentId) => new Environment({ id: environmentId }),
      );

      await queryRunner.manager.save(testcaseItem);

      if (assetTypeIds) {
        const validAssetTypes = await queryRunner.manager.find(AssetType, {
          where: { id: In(assetTypeIds) },
        });

        const validIds = validAssetTypes.map((a) => a.id);
        const invalidIds = assetTypeIds.filter((id) => !validIds.includes(id));

        if (invalidIds.length > 0) {
          throw new BadRequestException({
            message: this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
              args: { value: invalidIds.join(', '), property: 'AssetType' },
            }),
          });
        }

        const existingAssetTestCases = testcaseItem.assetTestCases || [];

        for (const atc of existingAssetTestCases) {
          if (!assetTypeIds.includes(atc.assetTypeId) && atc.isEnable) {
            atc.isEnable = false;
            await queryRunner.manager.save(atc);
          }
        }

        for (const atc of existingAssetTestCases) {
          if (assetTypeIds.includes(atc.assetTypeId) && !atc.isEnable) {
            atc.isEnable = true;
            await queryRunner.manager.save(atc);
          }
        }

        const existingIds = existingAssetTestCases.map(
          (atc) => atc.assetTypeId,
        );
        const newAssetTypeIds = assetTypeIds.filter(
          (id) => !existingIds.includes(id),
        );

        if (newAssetTypeIds.length > 0) {
          const newAssetTestCases = newAssetTypeIds.map((assetTypeId) => {
            const assetTestCase = new AssetTestCase({});
            assetTestCase.assetTypeId = assetTypeId;
            assetTestCase.isEnable = true;
            assetTestCase.testcaseItemId = testcaseItem.id;
            return assetTestCase;
          });

          await queryRunner.manager.save(newAssetTestCases);
        }
      }

      await queryRunner.commitTransaction();

      return await queryRunner.manager.findOne(TestcaseItem, {
        where: { id: testcaseItem.id },
        relations: { assetTestCases: true },
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
