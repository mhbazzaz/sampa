import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AssetRepository } from 'src/asset/repositories/asset.repository';
import { LocationRepository } from 'src/location/repositories/location.repository';
import { FindOneOptions, FindOptionsWhere, In, Like } from 'typeorm';
import { CreateTagDto } from '../dto/input/create-tag.dto';
import { UpdateTagDto } from '../dto/input/update-tag.dto';
import { Tag } from '../entities/tag.entity';
import { TagRepository } from '../repositories/tag.repository';

@Injectable()
export class TagService {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly assetRepository: AssetRepository,
    private readonly locationRepository: LocationRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(dto: CreateTagDto): Promise<Tag> {
    const existingTag = await this.tagRepository.findOne({
      where: { name: dto.name },
      withDeleted: true,
      relations: { assets: true, locations: true },
    });

    if (existingTag) {
      if (existingTag.deletedAt) {
        await this.tagRepository.recover([existingTag]);
      } else {
        await this.tagRepository.update(
          { id: existingTag.id },
          { isEnabled: true, deletedAt: null },
        );
      }
      return existingTag;
    }

    const tag = await this.tagRepository.save({
      name: dto.name,
      isEnabled: true,
    });

    if (dto.assetIds?.length) {
      tag.assets = await this.assetRepository.findAll({
        where: { id: In(dto.assetIds) },
      });
    }

    if (dto.locationIds?.length) {
      tag.locations = await this.locationRepository.findAll({
        where: { id: In(dto.locationIds) },
      });
    }

    return await this.tagRepository.save(tag);
  }

  //------------------------------
  async update(where: FindOptionsWhere<Tag>, dto: UpdateTagDto) {
    const tag = await this.tagRepository.findOne({
      where,
      relations: { assets: true, locations: true },
    });

    if (!tag) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND', {
          args: { property: 'Tag' },
        }),
      );
    }

    if (dto.name !== undefined) tag.name = dto.name;
    if (dto.isEnabled !== undefined) tag.isEnabled = dto.isEnabled;

    if (dto.assetIds) {
      tag.assets = dto.assetIds.length
        ? await this.assetRepository.findAll({
            where: { id: In(dto.assetIds) },
          })
        : [];
    }

    if (dto.locationIds) {
      tag.locations = dto.locationIds.length
        ? await this.locationRepository.findAll({
            where: { id: In(dto.locationIds) },
          })
        : [];
    }

    return await this.tagRepository.save(tag);
  }

  //------------------------------
  async findOne(data: FindOneOptions<Tag>): Promise<Tag | null> {
    return this.tagRepository.findOne(data);
  }

  //------------------------------
  async remove(id: string) {
    const relations: string[] = [];
    const tag = await this.tagRepository.findOne({
      where: { id, isEnabled: true },
      relations: { assets: true, locations: true },
    });

    if (!tag) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_NOT_FOUND', {
          args: { property: this.i18nService.t('objects.tag') },
        }),
      );
    }

    if (tag.assets && tag.assets.length > 0) {
      relations.push(this.i18nService.t('objects.asset'));
    }

    if (tag.locations && tag.locations.length > 0) {
      relations.push(this.i18nService.t('objects.location'));
    }

    if (relations.length > 0) {
      return this.tagRepository.update({ id }, { isEnabled: false });

      // throw new BadRequestException(
      //   this.i18nService.t('messages.ERROR_HAS_RELATION', {
      //     args: {
      //       property: relations.join(` ${this.i18nService.t('objects.and')} `),
      //     },
      //   }),
      // );
    }

    return this.tagRepository.findAndDelete({ id });
  }

  //------------------------------
  async findAllPagination(
    skip: number,
    take: number,
    name?: string,
    isEnabled?: boolean,
  ) {
    return this.tagRepository.findAllPagination(skip, take, {
      where: {
        name: name ? Like(`%${name}%`) : undefined,
        isEnabled: isEnabled ?? undefined,
      },
      order: { createdAt: 'DESC' },
    });
  }
}
