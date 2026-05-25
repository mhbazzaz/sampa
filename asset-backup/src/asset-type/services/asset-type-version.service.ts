import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AssetTypeVersionRepository } from '../repositories/asset-type-version.repository';

@Injectable()
export class AssetTypeVersionService {
  constructor(
    private readonly assetTypeVersionRepository: AssetTypeVersionRepository,
    private readonly i18nService: I18nService,
  ) {}
}
