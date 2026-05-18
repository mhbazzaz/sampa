import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersRepository extends AbstractRepository<User> {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly i18nService: I18nService,
  ) {
    super(userRepository, i18nService);
  }
}
