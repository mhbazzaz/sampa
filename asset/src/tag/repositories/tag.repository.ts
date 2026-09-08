import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class TagRepository extends AbstractRepository<Tag> {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    private readonly i18nService: I18nService,
  ) {
    super(tagRepository, i18nService);
  }
}
