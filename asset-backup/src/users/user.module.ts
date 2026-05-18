import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';
import { UsersController } from './controllers/users..controller';
import { User } from './entities/user.entity';
import { UsersRepository } from './repositories/user.repository';
import { UsersService } from './services/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersRepository, RabbitMQService, UsersService],
  exports: [UsersRepository],
})
export class UsersModule {}
