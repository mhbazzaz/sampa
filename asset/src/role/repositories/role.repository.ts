import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class RoleRepository extends AbstractRepository<Role> {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private readonly i18nService: I18nService,
  ) {
    super(roleRepository, i18nService);
  }
}
