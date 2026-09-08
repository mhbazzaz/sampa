import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Action } from './entities/action.entity';
import { ActionRepository } from './repositories/action.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Action])],
  controllers: [],
  providers: [ActionRepository],
  exports: [ActionRepository],
})
export class ActionModule {}
