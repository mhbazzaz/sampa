import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AssetScoringFactorRepository } from '../repositories/asset-scoring-factor.repository';

export interface searchBody {
  [name: string]: searchBody | string;
}

export type searchBodyTag = searchBody & {
  tags: string[];
};

@Injectable()
export class AssetScoreService {
  constructor(
    private readonly assetScoringFactorRepository: AssetScoringFactorRepository,
    private readonly i18nService: I18nService,
  ) {}

  async getAssetScores() {
    return this.assetScoringFactorRepository.findAll({
      relations: { scores: true },
    });
  }
}
