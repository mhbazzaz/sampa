import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetModule } from 'src/asset/asset.module';
import { CheckTagNameExistValidator } from 'src/common/validations/check-tag-name-exists.validator';
import { LocationModule } from 'src/location/location.module';
import { TagController } from './controllers/tag.controller';
import { Tag } from './entities/tag.entity';
import { TagRepository } from './repositories/tag.repository';
import { TagService } from './services/tag.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tag]),
    forwardRef(() => AssetModule),
    forwardRef(() => LocationModule),
  ],
  controllers: [TagController],
  providers: [TagService, TagRepository, CheckTagNameExistValidator],
  exports: [TagRepository, TagService],
})
export class TagModule {}
