import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionController } from './controllers/action.controller';
import { Action } from './entities/action.entity';
import { ActionRepository } from './repositories/action.repository';
import { ActionService } from './services/action.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Action])],
  controllers: [ActionController],
  providers: [ActionService, ActionRepository],
  exports: [ActionRepository],
})
export class ActionModule {}
