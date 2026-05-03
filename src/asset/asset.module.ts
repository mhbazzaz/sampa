import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMembership } from 'src/group-membership/entities/group-membership.entity';
import { GroupMembershipRepository } from 'src/group-membership/repositories/group-membership.repository';
import { AssetCategoryController } from './controllers/asset-category.controller';
import { AssetTypeController } from './controllers/asset-type.controller';
import { AssetController } from './controllers/asset.controller';
import { AssetCategory } from './entities/asset-category.entity';
import { AssetToAudit } from './entities/asset-to-audit.entity';
import { AssetType } from './entities/asset-type.entity';
import { AssetCategoryRepository } from './repositories/asset-category.repository';
import { AssetRepository } from './repositories/asset-to-audit.repository';
import { AssetTypeRepository } from './repositories/asset-type.repository';
import { AssetCategoryService } from './services/asset-category.service';
import { AssetService } from './services/asset-to-audit.service';
import { AssetTypeService } from './services/asset-type.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssetType,
      AssetToAudit,
      AssetCategory,
      GroupMembership,
    ]),
  ],
  controllers: [AssetController, AssetTypeController, AssetCategoryController],
  providers: [
    AssetService,
    AssetRepository,
    AssetTypeService,
    AssetTypeRepository,
    AssetCategoryService,
    GroupMembershipRepository,
    AssetCategoryRepository,
  ],
  exports: [AssetService, AssetTypeRepository, AssetCategoryRepository],
})
export class AssetModule {}
