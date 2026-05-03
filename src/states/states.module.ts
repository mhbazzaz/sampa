import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatesController } from './controllers/states.controller';
import { State } from './entities/state.entity';
import { StatesRepository } from './repositories/state.repository';
import { StatesService } from './services/states.service';

@Module({
  imports: [TypeOrmModule.forFeature([State])],
  controllers: [StatesController],
  providers: [StatesService, StatesRepository],
  exports: [StatesService, StatesRepository],
})
export class StatesModule {}
