import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { AssetRelation } from '../entities/asset-relation.entity';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AssetRelationRepository extends AbstractRepository<AssetRelation> {
  constructor(
    @InjectRepository(AssetRelation)
    private assetRelationRepository: Repository<AssetRelation>,
    private readonly i18nService: I18nService,
  ) {
    super(assetRelationRepository, i18nService);
  }
}
