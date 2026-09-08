import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetTypeModule } from 'src/asset-type/asset-type.module';
import { AssetModule } from 'src/asset/asset.module';
import { Location } from 'src/location/entities/location.entity';
import { LocationRepository } from 'src/location/repositories/location.repository';
import { TagModule } from 'src/tag/tag.module';
import { File } from './entities/file.entity';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FileRepository } from './repositories/file.repository';

@Module({
  imports: [
    AssetTypeModule,
    AssetModule,
    TagModule,
    TypeOrmModule.forFeature([File, Location]),
  ],
  controllers: [FileController],
  providers: [FileService, FileRepository, LocationRepository],
})
export class FileModule {}
