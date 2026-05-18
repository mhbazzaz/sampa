import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AssetService } from 'src/asset/services/asset.service';
import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
import { LocationTypeRepository } from 'src/location-type/repositories/location-type.repository';
import { TagRepository } from 'src/tag/repositories/tag.repository';
import { FindOneOptions, FindOptionsWhere, In, IsNull } from 'typeorm';
import { CreateLocationDto } from '../dto/input/create-location.dto';
import { FindAllLocationQueryDto } from '../dto/input/find-all-location-query.dto';
import { FindAllLocationUserQueryDto } from '../dto/input/find-all-location-user-query.dto';
import { Location } from '../entities/location.entity';
import { LocationRepository } from '../repositories/location.repository';

@Injectable()
export class LocationService {
  constructor(
    private readonly locationRepository: LocationRepository,
    private readonly locationTypeRepository: LocationTypeRepository,
    private readonly tagRepository: TagRepository,
    private readonly assetService: AssetService,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(data: CreateLocationDto): Promise<Location> {
    if (data.parentId) {
      const parent = await this.locationRepository.findOne({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new BadRequestException(
          this.i18nService.t('messages.ERROR_NOT_FOUND', {
            args: { property: 'Location' },
          }),
        );
      }
    }

    let tags;
    if (data.tagIds?.length) {
      tags = await this.tagRepository.findAll({
        where: { id: In(data.tagIds) },
      });
    }

    const locationType = await this.locationTypeRepository.findOne({
      where: { id: data.locationTypeId },
    });

    if (!locationType) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND', {
          args: { property: 'Location Type' },
        }),
      );
    }

    return await this.locationRepository.save({
      name: data.name,
      code: data.code,
      exCode: data.exCode ?? null,
      address: data.address,
      parentId: data.parentId,
      locationTypeId: data.locationTypeId,
      tags,
    });
  }

  //------------------------------
  async findOne(data: FindOneOptions<Location>): Promise<Location | null> {
    return this.locationRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.locationRepository.findAll();
  }

  //------------------------------
  async findRelatedLocations(locationId: string) {
    const [location, relatedLocations] = await Promise.all([
      this.locationRepository.findOne({
        where: { id: locationId },
        relations: { locationType: true, tags: true },
      }),
      this.locationRepository.findAll({
        where: { parentId: locationId },
        relations: { locationType: true, tags: true },
        order: { createdAt: 'DESC' },
      }),
    ]);

    if (!location) {
      throw new NotFoundException(
        this.i18nService.t('messages.ERROR_NOT_FOUND', {
          args: { property: 'Location' },
        }),
      );
    }

    return {
      location,
      relatedLocations,
    };
  }

  //------------------------------
  async findAssetVersionsByLocationId(
    locationId: string,
    query: PaginationDto,
  ) {
    const { data, total } =
      await this.assetService.findAssetVersionsByLocationId(
        locationId,
        query.skip,
        query.take,
      );

    return { data, total };
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<Location>,
    updateLocation: Partial<Location>,
  ) {
    return this.locationRepository.update(data, updateLocation);
  }

  //------------------------------
  async remove(id: string) {
    const locationType = await this.locationRepository.findOne({
      where: { id },
      relations: { children: true, assetVersions: true },
    });

    if (!locationType) {
      throw new NotFoundException();
    }

    const relations = [];

    if (locationType.children && locationType.children.length > 0) {
      relations.push(this.i18nService.t('objects.location'));
    }
    if (locationType.assetVersions && locationType.assetVersions.length > 0) {
      relations.push(this.i18nService.t('objects.asset'));
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

    return this.locationRepository.findAndDelete({ id });
  }

  //------------------------------
  async findAllPagination(query: FindAllLocationQueryDto) {
    return this.locationRepository.findAllPaginateAdminScope(query);
  }

  //------------------------------
  async findBaseLocations() {
    return await this.locationRepository.findAll({
      where: { parentId: IsNull(), deletedAt: IsNull() },
      relations: { locationType: true, tags: true },
    });
  }

  //------------------------------
  async findAllUserScope(query: FindAllLocationUserQueryDto) {
    return this.locationRepository.findAllPaginateUserScope(query);
  }

  //------------------------------
  async findOneLocation(id: string) {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: { locationType: true, tags: true, parent: true },
    });

    if (!location) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND', {
          args: { property: 'Location' },
        }),
      );
    }

    const locatedAssetVersions =
      await this.assetService.findAssetVersionsByLocationId(id);

    return {
      ...location,
      locatedAssetVersions,
    };
  }

  //------------------------------
  async findOneLocationAdmin(id: string) {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: { locationType: true, tags: true, parent: true },
    });

    if (!location) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND', {
          args: { property: 'Location' },
        }),
      );
    }

    return location;
  }

  //------------------------------
  async findOneLocationUser(id: string) {
    return this.locationRepository.findOne({
      where: { id },
      relations: { locationType: true, tags: true, parent: true },
    });
  }
}
