import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { I18nService } from 'nestjs-i18n';
import { AssetTypeRepository } from 'src/asset-type/repositories/asset-type.repository';
import { User } from 'src/users/entities/user.entity';
import { Vault } from 'src/vault/vault';
import { FindOneOptions, FindOptionsWhere, ILike } from 'typeorm';
import { CreateAssetCategoryDto } from '../dto/input/create-asset-category.dto';
import { FindAllAdminScopeDto } from '../dto/input/find-all-admin-scope-quey.dto';
import { GetAssetCategoryUserPaginationDto } from '../dto/input/get-asset-category-user-pagination.dto';
import { AssetCategory } from '../entities/asset-category.entity';
import { AssetCategoryRepository } from '../repositories/asset-category.repository';

@Injectable()
export class AssetCategoryService {
  constructor(
    private readonly assetCategoryRepository: AssetCategoryRepository,
    private readonly assetTypeRepository: AssetTypeRepository,
    private readonly i18nService: I18nService,
  ) {}

  //------------------------------
  async create(data: CreateAssetCategoryDto): Promise<AssetCategory> {
    return this.assetCategoryRepository.save(data);
  }

  //------------------------------
  async findOne(
    data: FindOneOptions<AssetCategory>,
  ): Promise<AssetCategory | null> {
    return this.assetCategoryRepository.findOne(data);
  }

  //------------------------------
  async findAll() {
    return this.assetCategoryRepository.findAll();
  }

  //------------------------------
  async update(
    data: FindOptionsWhere<AssetCategory>,
    updateCategory: Partial<AssetCategory>,
  ) {
    return this.assetCategoryRepository.update(data, updateCategory);
  }

  //------------------------------
  async remove(id: string) {
    const assetType = await this.assetTypeRepository.findOne({
      where: { assetCategoryId: id },
    });
    if (assetType) {
      throw new BadRequestException(
        this.i18nService.t('messages.ERROR_HAS_RELATION', {
          args: { property: this.i18nService.t('objects.asset type') },
        }),
      );
    }
    return this.assetCategoryRepository.findAndDelete({ id });
  }

  //------------------------------
  async findAllPagination(query: FindAllAdminScopeDto) {
    return this.assetCategoryRepository.findAllPagination(
      query.skip,
      query.take,
      {
        where: { name: query.name ? ILike(`%${query.name}%`) : undefined },
        relations: { assetTypes: true },
        order: { createdAt: 'DESC' },
      },
    );
  }

  //------------------------------
  async findAllPaginationUserScope(skip: number, take: number, name: string) {
    return this.assetCategoryRepository.findAllPagination(skip, take, {
      where: { name: name ? ILike(`%${name}%`) : undefined },
      order: { createdAt: 'DESC' },
    });
  }

  //------------------------------
  async findCategoryForSampaUser(
    query: GetAssetCategoryUserPaginationDto,
    user: User,
  ) {
    const SAMPA_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'SAMPA_SERVICE_INTERNAL_TOKEN',
      'share',
    );

    const SAMPA_SERVICE_URL = await Vault.instance.get('SAMPA_SERVICE_URL');
    try {
      const { data } = await axios.get<{
        data: { assetCategory_id: string }[];
      }>(`${SAMPA_SERVICE_URL}/sampa/api/v1/asset-category/internal`, {
        headers: {
          'x-internal-communication-token': SAMPA_SERVICE_INTERNAL_TOKEN,
        },
      });

      const assetCategoryIds = data.data.map((assetCategory) => {
        return assetCategory.assetCategory_id;
      });

      return this.assetCategoryRepository.findCategoryForSampaUser(
        query,
        user,
        assetCategoryIds,
      );
    } catch {
      throw new InternalServerErrorException(
        'Error during fetching asset types from sampa!',
      );
    }
  }
}
