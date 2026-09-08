import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { State } from './entities/state.entity';
import { StatesRepository } from './repositories/state.repository';

@Module({
  imports: [TypeOrmModule.forFeature([State])],
  providers: [StatesRepository],
})
export class StatesModule {}
