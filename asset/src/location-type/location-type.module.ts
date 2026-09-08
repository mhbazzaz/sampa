import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckLocationTypeNameExistValidator } from 'src/common/validations/check-location-type-name-exists.validator';
import { LocationTypeController } from './controllers/location-type.controller';
import { LocationType } from './entities/location-type.entity';
import { LocationTypeRepository } from './repositories/location-type.repository';
import { LocationTypeService } from './services/location-type.service';

@Module({
  imports: [TypeOrmModule.forFeature([LocationType])],
  controllers: [LocationTypeController],
  providers: [
    LocationTypeService,
    LocationTypeRepository,
    CheckLocationTypeNameExistValidator,
  ],
  exports: [LocationTypeRepository],
})
export class LocationTypeModule {}
