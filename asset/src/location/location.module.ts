import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetModule } from 'src/asset/asset.module';
import { CheckLocationCodeExistValidator } from 'src/common/validations/check-location-code-exists.validator';
import { LocationTypeModule } from 'src/location-type/location-type.module';
import { TagModule } from 'src/tag/tag.module';
import { LocationController } from './controllers/location.controller';
import { Location } from './entities/location.entity';
import { LocationRepository } from './repositories/location.repository';
import { LocationService } from './services/location.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
    forwardRef(() => TagModule),
    forwardRef(() => AssetModule),
    LocationTypeModule,
  ],
  controllers: [LocationController],
  providers: [
    LocationService,
    LocationRepository,
    CheckLocationCodeExistValidator,
  ],
  exports: [LocationRepository],
})
export class LocationModule {}
