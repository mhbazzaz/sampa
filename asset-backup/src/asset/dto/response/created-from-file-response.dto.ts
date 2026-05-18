import { Asset } from 'src/asset/entities/asset.entity';

export type CreatedAssetFromFileResponseDto =
  | { asset?: Asset }
  | { errors: any[] };
