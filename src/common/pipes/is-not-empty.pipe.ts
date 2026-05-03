import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class IsNotEmptyPipe implements PipeTransform<string, string> {
  constructor(private i18nService: I18nService) {}
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException(
        this.i18nService.t('validation.IsNotEmpty', {
          args: { property: metadata.data },
        }),
      );
    }
    return value;
  }
}
