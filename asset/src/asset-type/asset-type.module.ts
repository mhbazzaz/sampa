import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetRelationTypeModule } from 'src/asset-relation-type/asset-relation-type.module';
import { CheckAssetTypeCodeExistValidator } from 'src/common/validations/check-asset-type-code-exists.validator';
import { CheckAssetTypeNameExistValidator } from 'src/common/validations/check-asset-type-name-exists.validator';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { FilterModule } from 'src/filter/filter.module';
import { LocationTypeModule } from 'src/location-type/location-type.module';
import { AssetTypeController } from './controllers/asset-type.controller';
import { AssetTypeRelation } from './entities/asset-type-relation.entity';
import { AssetTypeVersion } from './entities/asset-type-version.entity';
import { AssetType } from './entities/asset-type.entity';
import { AssetTypeRelationRepository } from './repositories/asset-type-relation.repository';
import { AssetTypeVersionRepository } from './repositories/asset-type-version.repository';
import { AssetTypeRepository } from './repositories/asset-type.repository';
import { AssetTypeVersionService } from './services/asset-type-version.service';
import { AssetTypeService } from './services/asset-type.service';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    FilterModule,
    LocationTypeModule,
    forwardRef(() => AssetRelationTypeModule),
    TypeOrmModule.forFeature([AssetType, AssetTypeRelation, AssetTypeVersion]),
  ],
  controllers: [AssetTypeController],
  providers: [
    AssetTypeService,
    AssetTypeRepository,
    AssetTypeVersionService,
    AssetTypeVersionRepository,
    ValidationService,
    CheckAssetTypeCodeExistValidator,
    CheckAssetTypeNameExistValidator,
    AssetTypeRelationRepository,
  ],
  exports: [
    AssetTypeService,
    AssetTypeRepository,
    AssetTypeRelationRepository,
    AssetTypeVersionRepository,
  ],
})
export class AssetTypeModule {}
