import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetTypeModule } from 'src/asset-type/asset-type.module';
import { CheckAssetCategoryExistValidator } from 'src/common/validations/check-asset-category-exists.validator';
import { ValidationService } from 'src/common/validations/schema-validation.service';
import { FilterModule } from 'src/filter/filter.module';
import { AssetCategoryController } from './controllers/asset-category.controller';
import { AssetCategory } from './entities/asset-category.entity';
import { AssetCategoryRepository } from './repositories/asset-category.repository';
import { AssetCategoryService } from './services/asset-category.service';

@Module({
  imports: [
    AssetTypeModule,
    FilterModule,
    TypeOrmModule.forFeature([AssetCategory]),
    FilterModule,
  ],
  controllers: [AssetCategoryController],
  providers: [
    AssetCategoryService,
    AssetCategoryRepository,
    ValidationService,
    CheckAssetCategoryExistValidator,
  ],
  exports: [AssetCategoryRepository],
})
export class AssetCategoryModule {}
