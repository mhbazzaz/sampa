import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { FindOneOptions, FindOptionsWhere, ILike } from 'typeorm';
import { CreateLocationTypeDto } from '../dto/input/create-location-type.dto';
import { FindAllLocationTypeQueryDto } from '../dto/input/find-all-location-type-query.dto';
import { FindAllLocationTypeUserQueryDto } from '../dto/input/find-all-location-type-user-query.dto';
import { LocationType } from '../entities/location-type.entity';
import { LocationTypeRepository } from '../repositories/location-type.repository';

@Injectable()
export class LocationTypeService {
  constructor(
    private readonly locationTypeRepository: LocationTypeRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(data: CreateLocationTypeDto): Promise<LocationType> {
    return this.locationTypeRepository.save(data);
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<LocationType>,
  ): Promise<LocationType | null> {
    return this.locationTypeRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.locationTypeRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<LocationType>,
    updateLocationType: Partial<LocationType>,
  ) {
    return this.locationTypeRepository.update(data, updateLocationType);
  }

  //------------------------------
  async remove(id: string) {
    const locationType = await this.locationTypeRepository.findOne({
      where: { id },
      relations: { locations: true },
    });
    if (!locationType) {
      throw new NotFoundException();
    }

    const relations = [];

    if (locationType.locations && locationType.locations.length > 0) {
      relations.push(this.i18nService.t('objects.asset type'));
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

    return this.locationTypeRepository.findAndDelete({ id });
  }

  //------------------------------
  async findAllPagination(query: FindAllLocationTypeQueryDto) {
    return this.locationTypeRepository.findAllPagination(
      query.skip,
      query.take,
      {
        where: {
          name: query.name ? ILike(`%${query.name}%`) : undefined,
          category: query.category ? query.category : undefined,
        },
        order: { createdAt: 'DESC' },
      },
    );
  }

  //------------------------------
  async findAllUserScope(query: FindAllLocationTypeUserQueryDto) {
    return this.locationTypeRepository.findAllUserScope({
      skip: query.skip,
      take: query.take,
      assetTypeVersionIds: query.assetTypeVersionIds,
      name: query.name,
      shouldBeRelatedToAssetTypeVersionId:
        query.shouldBeRelatedToAssetTypeVersionId,
    });
  }
}
