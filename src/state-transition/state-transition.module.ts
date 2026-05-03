import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StateTransitionController } from './controllers/state-transition.controller';
import { StateTransition } from './entities/state-transition.entity';
import { StateTransitionRepository } from './repositories/state-transition.repository';
import { StateTransitionService } from './services/state-transition.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([StateTransition])],
  controllers: [StateTransitionController],
  providers: [StateTransitionService, StateTransitionRepository],
  exports: [StateTransitionService, StateTransitionRepository],
})
export class StateTransitionModule {}
