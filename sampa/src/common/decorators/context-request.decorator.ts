import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ContextRequest = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest();
  },
);
