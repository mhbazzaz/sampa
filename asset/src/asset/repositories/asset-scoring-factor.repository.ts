import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { AssetScoringFactor } from '../entities/asset-scoring-factor.entity';

@Injectable()
export class AssetScoringFactorRepository extends AbstractRepository<AssetScoringFactor> {
  constructor(
    @InjectRepository(AssetScoringFactor)
    private readonly assetScoringFactorRepository: Repository<AssetScoringFactor>,
    private readonly i18nService: I18nService,
  ) {
    super(assetScoringFactorRepository, i18nService);
  }
}
