import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessController } from './controllers/process.controller';
import { Process } from './entities/process.entity';
import { ProcessRepository } from './repositories/process.repository';
import { ProcessService } from './services/process.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Process])],
  controllers: [ProcessController],
  providers: [ProcessService, ProcessRepository],
  exports: [ProcessRepository],
})
export class ProcessModule {}
