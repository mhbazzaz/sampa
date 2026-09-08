import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { I18nValidationPipe } from 'nestjs-i18n';

export const NoWhitelistBody = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const pipe = new I18nValidationPipe({ transform: true, whitelist: false });
    return pipe.transform(request.body, { type: 'body', metatype: data });
  },
);
