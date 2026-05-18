import { Injectable } from '@nestjs/common';
import { AssetTypeVersionRepository } from '../repositories/asset-type-version.repository';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AssetTypeVersionService {
  constructor(
    private readonly assetTypeVersionRepository: AssetTypeVersionRepository,
    private readonly i18nService: I18nService,
  ) {}
}
