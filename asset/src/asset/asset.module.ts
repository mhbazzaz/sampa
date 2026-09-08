import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionLogModule } from 'src/action-log/action-log.module';
import { AssetRelationTypeModule } from 'src/asset-relation-type/asset-relation-type.module';
import { AssetTypeModule } from 'src/asset-type/asset-type.module';
import { AssetModificationAccessGuard } from 'src/common/guards/asset-modification-access.guard';
import { CheckAssetExternalRefIdExistValidator } from 'src/common/validations/check-asset-external-ref-id-exists.validator copy';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { FilterModule } from 'src/filter/filter.module';
import { LocationTypeModule } from 'src/location-type/location-type.module';
import { LocationModule } from 'src/location/location.module';
import { TagModule } from 'src/tag/tag.module';
import { UsersModule } from 'src/users/user.module';
import { AssetRelationController } from './controllers/asset-relation.controller';
import { AssetController } from './controllers/asset.controller';
import { AssetRelation } from './entities/asset-relation.entity';
import { AssetScore } from './entities/asset-score.entity';
import { AssetScoringFactor } from './entities/asset-scoring-factor.entity';
import { AssetVersion } from './entities/asset-version.entity';
import { Asset } from './entities/asset.entity';
import { AssetRelationRepository } from './repositories/asset-relation.repository';
import { AssetScoringFactorRepository } from './repositories/asset-scoring-factor.repository';
import { AssetVersionRepository } from './repositories/asset-version.repository';
import { AssetRepository } from './repositories/asset.repository';
import { AssetRelationService } from './services/asset-relation.service';
import { AssetScoreService } from './services/asset-score.service';
import { AssetService } from './services/asset.service';

@Module({
  imports: [
    UsersModule,
    FilterModule,
    AssetRelationTypeModule,
    AssetTypeModule,
    LocationTypeModule,
    LocationModule,
    ActionLogModule,
    TypeOrmModule.forFeature([
      AssetRelation,
      Asset,
      AssetVersion,
      AssetScoringFactor,
      AssetScore,
    ]),
    FilterModule,
    forwardRef(() => TagModule),
    forwardRef(() => LocationModule),
  ],
  controllers: [AssetController, AssetRelationController],
  providers: [
    AssetService,
    AssetVersionRepository,
    AssetRepository,
    CheckAssetExternalRefIdExistValidator,
    AssetRelationService,
    AssetRelationRepository,
    ValidationService,
    AssetModificationAccessGuard,
    AssetScoringFactorRepository,
    AssetScoreService,
  ],
  exports: [AssetService, AssetRepository, AssetVersionRepository],
})
export class AssetModule {}
