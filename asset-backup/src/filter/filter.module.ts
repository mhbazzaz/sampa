import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilterController } from './controllers/filter.controller';
import { FilterValue } from './entities/filter-value.entity';
import { Filter } from './entities/filter.entity';
import { FilterValueRepository } from './repositories/filter-value.repository';
import { FilterRepository } from './repositories/filter.repository';
import { FilterService } from './services/filter.service';

@Module({
  imports: [TypeOrmModule.forFeature([Filter, FilterValue])],
  controllers: [FilterController],
  providers: [FilterService, FilterRepository, FilterValueRepository],
  exports: [FilterService, FilterRepository, FilterValueRepository],
})
export class FilterModule {}
