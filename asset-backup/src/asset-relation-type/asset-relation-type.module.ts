import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetTypeModule } from 'src/asset-type/asset-type.module';
import { AssetRelation } from 'src/asset/entities/asset-relation.entity';
import { AssetRelationRepository } from 'src/asset/repositories/asset-relation.repository';
import { CheckAssetRelationTypeExistValidator } from 'src/common/validations/check-asset-relation-type-exists.validator';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { FilterModule } from 'src/filter/filter.module';
import { AssetRelationTypeController } from './controllers/asset-relation-type.controller';
import { AssetRelationType } from './entities/asset-relation-type.entity';
import { AssetRelationTypeRepository } from './repositories/asset-relation-type.repository';
import { AssetRelationTypeService } from './services/asset-relation-type.service';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    forwardRef(() => AssetTypeModule),
    FilterModule,
    TypeOrmModule.forFeature([AssetRelationType, AssetRelation]),
  ],
  controllers: [AssetRelationTypeController],
  providers: [
    AssetRelationRepository,
    AssetRelationTypeService,
    AssetRelationTypeRepository,
    ValidationService,
    CheckAssetRelationTypeExistValidator,
  ],
  exports: [AssetRelationTypeRepository, AssetRelationTypeService],
})
export class AssetRelationTypeModule {}
