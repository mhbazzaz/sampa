import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { AssetRelationType } from '../entities/asset-relation-type.entity';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AssetRelationTypeRepository extends AbstractRepository<AssetRelationType> {
  constructor(
    @InjectRepository(AssetRelationType)
    private assetRelationTypeRepository: Repository<AssetRelationType>,
    private readonly i18nService: I18nService,
  ) {
    super(assetRelationTypeRepository, i18nService);
  }
}
