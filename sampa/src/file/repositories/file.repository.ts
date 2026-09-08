import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { File } from '../entities/file.entity';

@Injectable()
export class FileRepository extends AbstractRepository<File> {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private i18nService: I18nService,
  ) {
    super(fileRepository, i18nService);
  }
}
