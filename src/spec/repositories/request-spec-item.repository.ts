import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { DataSource, Repository } from 'typeorm';
import { FindFilteredRequestSpecItemQueryDto } from '../dto/input/find-filtered-request-spec-item.dto';
import { RequestSpecContent } from '../entities/request-spec-content.entity';
import { RequestSpecItem } from '../entities/request-spec-item.entity';

@Injectable()
export class RequestSpecItemRepository extends AbstractRepository<RequestSpecItem> {
  constructor(
    @InjectRepository(RequestSpecItem)
    private requestSpecItemRepository: Repository<RequestSpecItem>,
    private readonly dataSource: DataSource,
    private readonly i18nService: I18nService,
  ) {
    super(requestSpecItemRepository, i18nService);
  }

  //------------------------------
  async findFilteredRequestSpecItems(
    query: FindFilteredRequestSpecItemQueryDto,
  ): Promise<[RequestSpecItem[], number]> {
    const qb = this.requestSpecItemRepository
      .createQueryBuilder('requestSpecItem')
      .leftJoinAndSelect('requestSpecItem.assessmentType', 'assessmentType')
      .leftJoinAndSelect('assessmentType.assessmentLayers', 'assessmentLayers')
      .leftJoinAndSelect('requestSpecItem.assetType', 'assetType')
      .leftJoinAndSelect('requestSpecItem.environment', 'environment');

    if (query.assetTypeId) {
      qb.andWhere('requestSpecItem.assetTypeId = :assetTypeId', {
        assetTypeId: query.assetTypeId,
      });
    }

    if (query.environmentId) {
      qb.andWhere('requestSpecItem.environmentId = :environmentId', {
        environmentId: query.environmentId,
      });
    }

    if (query.requestSpecItemId) {
      qb.andWhere('requestSpecItem.id = :requestSpecItemId', {
        requestSpecItemId: query.requestSpecItemId,
      });
    }

    if (query.assessmentTypeIds && query.assessmentTypeIds.length > 0) {
      qb.andWhere('assessmentType.id IN (:...assessmentTypeIds)', {
        assessmentTypeIds: query.assessmentTypeIds,
      });
    }

    return qb.getManyAndCount();
  }

  //------------------------------
  async removeRequestSpecItemRelations(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const requestSpecItem = await queryRunner.manager.findOne(
        RequestSpecItem,
        {
          where: { id },
          relations: { assessmentType: true, requestSpecContents: true },
        },
      );

      if (!requestSpecItem) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_PROPERTY_ID_INVALID', {
            args: { value: id, property: 'specItem' },
          }),
        );
      }

      await queryRunner.manager
        .createQueryBuilder()
        .relation(RequestSpecItem, 'assessmentType')
        .of(id)
        .remove(requestSpecItem.assessmentType || []);

      if (requestSpecItem.requestSpecContents?.length) {
        const ids = requestSpecItem.requestSpecContents.map((c) => c.id);
        await queryRunner.manager.delete(RequestSpecContent, ids);
      }

      await queryRunner.manager
        .createQueryBuilder()
        .update(RequestSpecItem)
        .set({
          requestSpecGroupId: () => 'NULL',
          assetTypeId: () => 'NULL',
          environmentId: () => 'NULL',
        })
        .where('id = :id', { id })
        .execute();

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error during transaction', error);
      throw new InternalServerErrorException('Failed to clear relations');
    } finally {
      await queryRunner.release();
    }
  }
}
