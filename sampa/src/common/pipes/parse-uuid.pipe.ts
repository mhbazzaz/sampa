import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { validate as isUUID } from 'uuid';

@Injectable()
export class IsUUIDPipe implements PipeTransform<string, string> {
  constructor(private i18nService: I18nService) {}
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!isUUID(value)) {
      throw new BadRequestException(
        this.i18nService.t('validation.IsUUID', {
          args: { property: metadata.data },
        }),
      );
    }
    return value;
  }
}
